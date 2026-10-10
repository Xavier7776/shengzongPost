import { logFailure } from '@/lib/security/log'
import { withWriteGuard } from '@/lib/security/write-guard'
// app/api/comments/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/auth'
import { updateCommentStatus, deleteComment, addPoints, hasPointTransaction, sql } from '@/lib/db'

// PATCH /api/comments/[id]  body: { action: 'approve' | 'reject' }
async function handlePATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await requireAdminApi()
  if (!session) return NextResponse.json({ error: '无权限' }, { status: 401 })

  const id = Number(params.id)
  if (isNaN(id)) return NextResponse.json({ error: '参数错误' }, { status: 400 })

  try {
    const { action } = await req.json()
    if (action !== 'approve' && action !== 'reject') {
      return NextResponse.json({ error: '非法操作' }, { status: 400 })
    }

    // 检查当前评论状态，防止重复审核导致积分重复发放
    const existingRows = await sql`SELECT status FROM comments WHERE id = ${id} LIMIT 1`
    const existingStatus = (existingRows[0] as { status?: string })?.status
    if (existingStatus === 'approved' && action === 'approve') {
      // 已经是 approved，不再重复发积分
      const comment = await updateCommentStatus(id, 'approved')
      return NextResponse.json(comment)
    }

    const comment = await updateCommentStatus(id, action === 'approve' ? 'approved' : 'rejected')
    if (action === 'approve' && comment.user_id) {
      // 用幂等检查防止 AI 审核和手动审核重复发积分
      const alreadyRewarded = await hasPointTransaction(comment.user_id, 'comment_approved', comment.post_slug)
      if (!alreadyRewarded) await addPoints(comment.user_id, 5, 'comment_approved', comment.post_slug)
    }
    return NextResponse.json(comment)
  } catch (err) {
    logFailure('app/api/comments/[id]', err)
    return NextResponse.json({ error: '操作失败' }, { status: 500 })
  }
}

// ✅ 新增：DELETE /api/comments/[id]
async function handleDELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await requireAdminApi()
  if (!session) return NextResponse.json({ error: '无权限' }, { status: 401 })

  const id = Number(params.id)
  if (isNaN(id)) return NextResponse.json({ error: '参数错误' }, { status: 400 })

  try {
    await deleteComment(id)
    return NextResponse.json({ ok: true })
  } catch (err) {
    logFailure('app/api/comments/[id]', err)
    return NextResponse.json({ error: '删除失败' }, { status: 500 })
  }
}

export const PATCH = withWriteGuard(handlePATCH)
export const DELETE = withWriteGuard(handleDELETE)
