import { logFailure } from '@/lib/security/log'
import { withWriteGuard } from '@/lib/security/write-guard'
// app/api/comments/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/auth'
import { updateCommentStatus, deleteComment } from '@/lib/db'

// PATCH /api/comments/[id]  body: { action: 'approve' | 'reject' }
async function handlePATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdminApi()
  if (!session) return NextResponse.json({ error: '无权限' }, { status: 401 })

  const id = Number((await params).id)
  if (isNaN(id)) return NextResponse.json({ error: '参数错误' }, { status: 400 })

  try {
    const { action } = await req.json()
    if (action !== 'approve' && action !== 'reject') {
      return NextResponse.json({ error: '非法操作' }, { status: 400 })
    }

    const comment = await updateCommentStatus(id, action === 'approve' ? 'approved' : 'rejected')
    return NextResponse.json(comment)
  } catch (err) {
    if (err instanceof Error && err.message === 'Comment not found') return NextResponse.json({ error: '评论不存在' }, { status: 404 })
    logFailure('app/api/comments/[id]', err)
    return NextResponse.json({ error: '操作失败' }, { status: 500 })
  }
}

// ✅ 新增：DELETE /api/comments/[id]
async function handleDELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdminApi()
  if (!session) return NextResponse.json({ error: '无权限' }, { status: 401 })

  const id = Number((await params).id)
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
