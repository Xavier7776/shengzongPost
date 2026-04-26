// app/api/ai/write/route.ts
// POST /api/ai/write  → 编辑器 AI 写作助手（流式输出）
// mode: 'draft' | 'continue' | 'excerpt'

import { NextRequest } from 'next/server'
import { requireAdminApi } from '@/lib/auth'

const DEEPSEEK_API_KEY  = process.env.DEEPSEEK_API_KEY ?? ''
const DEEPSEEK_MODEL    = process.env.DEEPSEEK_MODEL ?? 'deepseek-v4-flash'
const DEEPSEEK_BASE_URL = 'https://api.deepseek.com/chat/completions'

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
}

export async function POST(req: NextRequest) {
  const session = await requireAdminApi()
  if (!session) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  if (!DEEPSEEK_API_KEY) {
    return new Response(JSON.stringify({ error: 'DEEPSEEK_API_KEY 未配置' }), { status: 503 })
  }

  const { mode, prompt, content, title } = await req.json()
  if (!mode || !SYSTEM_PROMPTS[mode]) {
    return new Response(JSON.stringify({ error: '无效的 mode' }), { status: 400 })
  }

  let userMessage = ''
  if (mode === 'draft') {
    if (!prompt?.trim()) return new Response(JSON.stringify({ error: '请输入主题描述' }), { status: 400 })
    userMessage = `文章标题：${title || '（未填写）'}\n\n主题描述：${prompt}`
  } else if (mode === 'continue') {
    if (!content?.trim()) return new Response(JSON.stringify({ error: '内容为空，无法续写' }), { status: 400 })
    userMessage = `已有内容（HTML）：\n\n${content.slice(-2000)}`
  } else if (mode === 'excerpt') {
    if (!content?.trim()) return new Response(JSON.stringify({ error: '内容为空，无法生成摘要' }), { status: 400 })
    // 摘要模式：剥离 HTML 标签后传给 AI，减少 token 浪费
    const plainText = content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
    userMessage = `文章标题：${title || '（未填写）'}\n\n文章内容：\n${plainText.slice(0, 3000)}`
  }

  const upstream = await fetch(DEEPSEEK_BASE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model: DEEPSEEK_MODEL,
      max_tokens: 2000,
      stream: true,
      messages: [
        { role: 'system', content: SYSTEM_PROMPTS[mode] },
        { role: 'user',   content: userMessage },
      ],
    }),
  })

  if (!upstream.ok) {
    const err = await upstream.text()
    console.error('[ai/write] DeepSeek error:', err)
    return new Response(JSON.stringify({ error: 'AI 服务调用失败', detail: err }), { status: 502 })
  }

  return new Response(upstream.body, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'X-Accel-Buffering': 'no',
    },
  })
}