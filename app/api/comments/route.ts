import { logFailure } from '@/lib/security/log'
import { allowAuthAttempt } from '@/lib/auth-rate-limit'
import { withWriteGuard } from '@/lib/security/write-guard'
// app/api/comments/route.ts
// GET  /api/comments?slug=xxx  → 已通过的评论列表
// POST /api/comments           → 提交评论（进入人工审核队列）

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { getApprovedComments, createComment, toggleCommentLike } from '@/lib/db'
export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get('slug')
  if (!slug) return NextResponse.json({ error: '缺少 slug' }, { status: 400 })
  try {
    // 尝试获取当前用户 ID（未登录也可查看）
    const session = await getServerSession(authOptions)
    const userId = session?.user ? Number((session.user as { id?: string }).id) : undefined
    return NextResponse.json(await getApprovedComments(slug, userId))
  } catch (err) {
    logFailure('app/api/comments', err)
    return NextResponse.json({ error: '读取失败' }, { status: 500 })
  }
}

async function handlePOST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: '请先登录' }, { status: 401 })

  if (!await allowAuthAttempt(req, 'comment', String((session.user as { id?: string }).id))) return NextResponse.json({ error: '操作太频繁，请稍后重试' }, { status: 429 })

  try {
    const { post_slug, content, parent_id } = await req.json()
    if (!post_slug || !content?.trim())
      return NextResponse.json({ error: '内容不能为空' }, { status: 400 })
    if (content.trim().length > 1000)
      return NextResponse.json({ error: '评论不能超过 1000 字' }, { status: 400 })

    const userId = Number((session.user as { id?: string }).id)
    if (!userId) return NextResponse.json({ error: '用户信息异常' }, { status: 400 })

    // 1. 先写入数据库（默认 approved=false，进入待审核状态）
    await createComment({
      post_slug,
      content: content.trim(),
      user_id: userId,
      user_name: session.user.name ?? '匿名用户',
      parent_id: parent_id ? Number(parent_id) : null,
    })

    return NextResponse.json({
      ok: true,
      // 告知前端评论已提交，等待审核
      pending: true,
      message: '评论已提交，等待管理员审核，通过后将显示',
    })
  } catch (err) {
    logFailure('app/api/comments', err)
    return NextResponse.json({ error: '提交失败，请重试' }, { status: 500 })
  }
}

async function handlePATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: '请先登录' }, { status: 401 })

  try {
    const { commentId } = await req.json()
    if (!commentId) return NextResponse.json({ error: '缺少 commentId' }, { status: 400 })

    const userId = Number((session.user as { id?: string }).id)
    if (!userId) return NextResponse.json({ error: '用户信息异常' }, { status: 400 })

    const result = await toggleCommentLike(Number(commentId), userId)
    return NextResponse.json(result)
  } catch (err) {
    logFailure('app/api/comments', err)
    return NextResponse.json({ error: '操作失败' }, { status: 500 })
  }
}

export const POST = withWriteGuard(handlePOST)
export const PATCH = withWriteGuard(handlePATCH)
