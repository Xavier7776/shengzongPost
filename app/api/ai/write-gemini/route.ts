// app/api/ai/write-gemini/route.ts
// POST /api/ai/write-gemini → 编辑器 AI 写作助手（Gemini Interactions API，流式输出）
// mode: 'draft' | 'continue' | 'excerpt' | 'rewrite'
//
// 设计要点：
// 1. REST 直连 Gemini Interactions API（无 SDK 依赖，与现有 MiMo 路由风格一致）
// 2. 后端把 Gemini 的 SSE 事件格式 {event_type, delta:{type,text}} 转成 OpenAI 兼容格式
//    data: {"choices":[{"delta":{"content":"..."}}]}，前端解析逻辑零改动
// 3. 所有 prompt 仍要求输出 HTML 片段（与 MiMo 路由一致），excerpt 输出纯文本
//
// 官方文档：https://ai.google.dev/gemini-api/docs/text-generation

import { NextRequest } from 'next/server'
import { requireAdminApi } from '@/lib/auth'

const GEMINI_API_KEY  = process.env.GEMINI_API_KEY ?? ''
const GEMINI_MODEL    = process.env.GEMINI_MODEL ?? 'gemini-3.5-flash'
const GEMINI_BASE_URL = process.env.GEMINI_BASE_URL ?? 'https://generativelanguage.googleapis.com/v1beta'

const SYSTEM_PROMPTS: Record<string, string> = {
  draft: `你是一位专业的技术博客写手。根据用户给出的主题和要点，生成一篇结构清晰、内容有深度的中文博客文章草稿。
格式要求：
- 输出纯 HTML 片段（不要 <!DOCTYPE>、<html>、<head>、<body> 等外层标签）
- 使用以下 HTML 标签：<h2> 二级标题、<h3> 三级标题、<p> 段落、<ul><li> 无序列表、<ol><li> 有序列表、<blockquote><p> 引用、<pre><code> 代码块、<strong> 加粗、<em> 斜体
- 正文 800～1500 字左右
- 语言自然流畅，避免过于学术化
- 直接输出 HTML 内容，不要输出任何前缀说明`,

  continue: `你是一位专业的技术博客写手。根据用户提供的已有 HTML 内容，自然地续写后续段落。
要求：
- 输出纯 HTML 片段，风格与已有内容保持一致
- 使用 <p>、<h2>、<h3>、<ul><li>、<blockquote><p>、<pre><code>、<strong>、<em> 等标签
- 续写 200～400 字
- 直接输出续写的 HTML 内容，不要重复已有内容，不要任何前缀说明`,

  excerpt: `你是一位编辑助手。根据博客文章内容，生成一段简洁的摘要。
要求：
- 80～120 字纯文本（不需要 HTML 标签）
- 提炼文章核心观点
- 语言简练，适合展示在文章列表页
- 直接输出摘要文字，不要任何前缀`,

  rewrite: `你是一位专业的文字编辑。根据用户的改写指令，对给定的文字进行改写。
要求：
- 保持原文的 HTML 标签结构（如果原文是 HTML），输出与原文同样格式的 HTML 片段
- 如果原文是纯文本，输出纯文本
- 严格按用户的改写指令调整（如"更简洁""更正式""修复语法""改成更口语化"等）
- 只输出改写后的内容，不要任何前缀说明、不要解释改了什么`,
}

export async function POST(req: NextRequest) {
  const session = await requireAdminApi()
  if (!session) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  if (!GEMINI_API_KEY) {
    return new Response(JSON.stringify({ error: 'GEMINI_API_KEY 未配置' }), { status: 503 })
  }

  const { mode, prompt, content, title, selection } = await req.json()
  if (!mode || !SYSTEM_PROMPTS[mode]) {
    return new Response(JSON.stringify({ error: '无效的 mode' }), { status: 400 })
  }

  // 构造 user message（与 MiMo 路由逻辑保持一致，新增 rewrite 模式）
  let userMessage = ''
  if (mode === 'draft') {
    if (!prompt?.trim()) return new Response(JSON.stringify({ error: '请输入主题描述' }), { status: 400 })
    userMessage = `文章标题：${title || '（未填写）'}\n\n主题描述：${prompt}`
  } else if (mode === 'continue') {
    if (!content?.trim()) return new Response(JSON.stringify({ error: '内容为空，无法续写' }), { status: 400 })
    userMessage = `已有内容（HTML）：\n\n${content.slice(-2000)}`
  } else if (mode === 'excerpt') {
    if (!content?.trim()) return new Response(JSON.stringify({ error: '内容为空，无法生成摘要' }), { status: 400 })
    const plainText = content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
    userMessage = `文章标题：${title || '（未填写）'}\n\n文章内容：\n${plainText.slice(0, 3000)}`
  } else if (mode === 'rewrite') {
    if (!selection?.trim()) return new Response(JSON.stringify({ error: '请先在编辑器中选中要改写的文字' }), { status: 400 })
    if (!prompt?.trim()) return new Response(JSON.stringify({ error: '请输入改写指令（如"更简洁""更正式"）' }), { status: 400 })
    userMessage = `改写指令：${prompt}\n\n原文：\n${selection}`
  }

  // 调 Gemini Interactions API（流式）
  // 文档：https://ai.google.dev/gemini-api/docs/text-generation#streaming-responses
  const upstream = await fetch(`${GEMINI_BASE_URL}/interactions?alt=sse`, {
    method: 'POST',
    headers: {
      'x-goog-api-key': GEMINI_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: GEMINI_MODEL,
      input: userMessage,
      system_instruction: SYSTEM_PROMPTS[mode],
      generation_config: {
        // 低 thinking level：响应更快、更便宜（写作助手不需要复杂推理）
        thinking_level: 'low',
        temperature: 0.8,
      },
      stream: true,
    }),
  })

  if (!upstream.ok || !upstream.body) {
    const err = await upstream.text()
    console.error('[ai/write-gemini] Gemini error:', err)
    return new Response(JSON.stringify({ error: 'Gemini 调用失败', detail: err }), { status: 502 })
  }

  // SSE 格式转换：Gemini 事件 → OpenAI 兼容格式
  // Gemini SSE 行：data: {"event_type":"step.delta","delta":{"type":"text","text":"..."}}
  // OpenAI 期望：  data: {"choices":[{"delta":{"content":"..."}}]}
  // 结束标记：     data: [DONE]
  const decoder = new TextDecoder()
  const encoder = new TextEncoder()
  const reader = upstream.body.getReader()
  let buffer = ''

  const stream = new ReadableStream({
    async pull(controller) {
      const { done, value } = await reader.read()
      if (done) {
        controller.enqueue(encoder.encode('data: [DONE]\n\n'))
        controller.close()
        return
      }
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue
        const data = line.slice(6).trim()
        if (!data) continue
        try {
          const evt = JSON.parse(data)
          // 文档：event.event_type === "step.delta" && event.delta.type === "text"
          if (evt.event_type === 'step.delta' && evt.delta?.type === 'text' && evt.delta.text) {
            const openaiChunk = { choices: [{ delta: { content: evt.delta.text } }] }
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(openaiChunk)}\n\n`))
          }
          // 其他事件类型（如 step.start / step.complete）忽略
        } catch {
          // 解析失败的行跳过
        }
      }
    },
    cancel() {
      reader.cancel()
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'X-Accel-Buffering': 'no',
    },
  })
}
