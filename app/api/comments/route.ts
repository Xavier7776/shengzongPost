// app/api/comments/route.ts
// GET  /api/comments?slug=xxx  → 已通过的评论列表
// POST /api/comments           → 提交评论（自动触发 AI 审核，通过则直接公开）

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { getApprovedComments, createComment, updateCommentStatus } from '@/lib/db'

const INTERNAL_SECRET = process.env.AI_COMMENT_SECRET ?? 'ai-comment-internal'
const BASE_URL = process.env.NEXTAUTH_URL ?? 'http://localhost:3000'

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get('slug')
  if (!slug) return NextResponse.json({ error: '缺少 slug' }, { status: 400 })
  try {
    return NextResponse.json(await getApprovedComments(slug))
  } catch (err) {
    console.error('[comments GET]', err)
    return NextResponse.json({ error: '读取失败' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: '请先登录' }, { status: 401 })

  try {
    const { post_slug, content, parent_id } = await req.json()
    if (!post_slug || !content?.trim())
      return NextResponse.json({ error: '内容不能为空' }, { status: 400 })
    if (content.trim().length > 1000)
      return NextResponse.json({ error: '评论不能超过 1000 字' }, { status: 400 })

    const userId = Number((session.user as { id?: string }).id)
    if (!userId) return NextResponse.json({ error: '用户信息异常' }, { status: 400 })

    // 1. 先写入数据库（默认 approved=false，进入待审核状态）
    const comment = await createComment({
      post_slug,
      content: content.trim(),
      user_id: userId,
      user_name: session.user.name ?? '匿名用户',
      parent_id: parent_id ? Number(parent_id) : null,
    })

    // 2. 异步调用 AI 审核（不阻塞本次响应）
    //    fire-and-forget：先响应给用户，AI 在后台判断
    void callAiReview(comment.id, post_slug, content.trim())

    return NextResponse.json({
      ok: true,
      // 告知前端评论已提交，等待审核
      pending: true,
      message: '评论已提交，正在审核中，审核通过后将自动显示',
    })
  } catch (err) {
    console.error('[comments POST]', err)
    return NextResponse.json({ error: '提交失败，请重试' }, { status: 500 })
  }
}

// ── AI 审核（fire-and-forget）─────────────────────────────────────────────────
async function callAiReview(commentId: number, postSlug: string, content: string) {
  try {
    const resp = await fetch(`${BASE_URL}/api/ai/review-comment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${INTERNAL_SECRET}`,
      },
      body: JSON.stringify({ content, post_slug: postSlug }),
    })

    if (!resp.ok) {
      console.error(`[comments] AI 审核请求失败，commentId=${commentId}`)
      return
    }

    const { pass, reason } = await resp.json()
    console.log(`[comments] AI 审核结果 commentId=${commentId}: pass=${pass}, reason="${reason}"`)

    if (pass) {
      // 通过 → 直接标记为已审核
      await updateCommentStatus(commentId, 'approved')
      console.log(`[comments] 评论 ${commentId} 已自动通过`)
    } else {
      // 未通过 → 保留在待审核队列，等待人工处理
      console.log(`[comments] 评论 ${commentId} 进入人工审核队列，原因：${reason}`)
    }
  } catch (err) {
    console.error(`[comments] AI 审核调用异常，commentId=${commentId}:`, err)
  }
}
