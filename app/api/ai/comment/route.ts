// app/api/ai/comment/route.ts
// POST /api/ai/comment  → 异步生成并插入 AI 评论（仅供内部服务调用）
//
// 调用方式：fire-and-forget，不等待响应。
// 若 OPENROUTER_API_KEY 未配置则静默跳过。

import { NextRequest, NextResponse } from 'next/server'
import { createApprovedComment, getOrCreateAiBot, getPostBySlug, deleteAiBotCommentForPost } from '@/lib/db'

// 内部调用鉴权：使用固定的 secret，通过 Authorization header 传递
const INTERNAL_SECRET = process.env.AI_COMMENT_SECRET ?? 'ai-comment-internal'
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY ?? ''
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL ?? 'anthropic/claude-3-haiku'

export async function POST(req: NextRequest) {
  // ── 鉴权 ──
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${INTERNAL_SECRET}`) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (!OPENROUTER_API_KEY) {
    console.warn('[ai/comment] OPENROUTER_API_KEY 未配置，跳过')
    return NextResponse.json({ ok: true, skipped: true })
  }

  const { slug } = await req.json()
  if (!slug) return NextResponse.json({ error: '缺少 slug' }, { status: 400 })

  try {
    // ── 先删除该文章已有的 AI 评论，避免重复 ──
    await deleteAiBotCommentForPost(slug)

    // ── 取文章内容 ──
    const post = await getPostBySlug(slug)
    if (!post) return NextResponse.json({ error: '文章不存在' }, { status: 404 })

    // ── 截取前 2000 字防止超限 ──
    const excerpt = post.content.slice(0, 2000)

    // ── 调用 OpenRouter ──
    const resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': process.env.NEXTAUTH_URL ?? 'http://localhost:3000',
        'X-Title': 'ARC Blog AI Comment',
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        max_tokens: 300,
        messages: [
          {
            role: 'system',
            content: `你是一位严肃但友善的技术读者。你会对博客文章写下简短、有洞察力的中文评论（80～150字）。
评论要求：
- 围绕文章的核心观点或技术细节展开，不泛泛而谈
- 可以提出一个值得思考的问题或补充视角
- 语气自然，不过于正式，不要以"这篇文章"开头
- 不要自我介绍，直接开始评论内容
- 不超过 150 字`,
          },
          {
            role: 'user',
            content: `文章标题：${post.title}\n\n文章内容（节选）：\n${excerpt}`,
          },
        ],
      }),
    })

    if (!resp.ok) {
      const errText = await resp.text()
      console.error('[ai/comment] OpenRouter 调用失败:', errText)
      return NextResponse.json({ error: 'OpenRouter 调用失败' }, { status: 502 })
    }

    const data = await resp.json()
    const aiText = data.choices?.[0]?.message?.content?.trim()
    if (!aiText) {
      console.error('[ai/comment] 返回内容为空')
      return NextResponse.json({ error: '生成内容为空' }, { status: 502 })
    }

    // ── 获取或创建 AI bot 用户 ──
    const bot = await getOrCreateAiBot()

    // ── 直接以 approved 状态插入评论 ──
    await createApprovedComment({
      post_slug: slug,
      user_id: bot.id,
      user_name: bot.name,
      content: aiText,
    })

    console.log(`[ai/comment] 已为 "${slug}" 生成 AI 评论`)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[ai/comment]', err)
    return NextResponse.json({ error: '内部错误' }, { status: 500 })
  }
}
