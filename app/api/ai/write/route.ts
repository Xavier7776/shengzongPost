// app/api/ai/write/route.ts
// POST /api/ai/write  → 编辑器 AI 写作助手（流式输出）
// mode: 'draft' | 'continue' | 'excerpt'
//
// ✅ 已从 OpenRouter 迁移至 DeepSeek 官方 API
// 文档：https://platform.deepseek.com/api-docs/

import { NextRequest } from 'next/server'
import { requireAdminApi } from '@/lib/auth'

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY ?? ''
const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL ?? 'deepseek-chat'
const DEEPSEEK_BASE_URL = 'https://api.deepseek.com/chat/completions'

const SYSTEM_PROMPTS: Record<string, string> = {
  draft: `你是一位专业的技术博客写手。根据用户给出的主题和要点，生成一篇结构清晰、内容有深度的中文博客文章草稿。
格式要求：
- 使用 Markdown 格式（## 二级标题，### 三级标题，\`\`\`代码块，> 引用，- 列表）
- 正文 800～1500 字左右
- 语言自然流畅，避免过于学术化
- 直接输出正文，不要输出"好的""以下是"等前缀`,

  continue: `你是一位专业的技术博客写手。根据用户提供的已有内容，自然地续写后续段落。
要求：
- 风格与已有内容保持一致
- 续写 200～400 字
- 使用 Markdown 格式
- 直接输出续写内容，不要重复已有内容，不要输出任何前缀说明`,

  excerpt: `你是一位编辑助手。根据博客文章内容，生成一段简洁的摘要。
要求：
- 80～120 字
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
    return new Response(JSON.stringify({ error: 'DEEPSEEK_API_KEY 未配置，请在 .env.local 中添加' }), { status: 503 })
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
    userMessage = `已有内容：\n\n${content.slice(-1500)}`
  } else if (mode === 'excerpt') {
    if (!content?.trim()) return new Response(JSON.stringify({ error: '内容为空，无法生成摘要' }), { status: 400 })
    userMessage = `文章标题：${title || '（未填写）'}\n\n文章内容：\n${content.slice(0, 3000)}`
  }

  // ── 调用 DeepSeek 官方 API（流式） ──
  const upstream = await fetch(DEEPSEEK_BASE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model: DEEPSEEK_MODEL,
      max_tokens: 1500,
      stream: true,
      messages: [
        { role: 'system', content: SYSTEM_PROMPTS[mode] },
        { role: 'user', content: userMessage },
      ],
    }),
  })

  if (!upstream.ok) {
    const err = await upstream.text()
    console.error('[ai/write] DeepSeek error:', err)
    return new Response(JSON.stringify({ error: 'AI 服务调用失败', detail: err }), { status: 502 })
  }

  // 直接透传 SSE 流给客户端（格式与 OpenAI 兼容，前端无需改动）
  return new Response(upstream.body, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'X-Accel-Buffering': 'no',
    },
  })
}
