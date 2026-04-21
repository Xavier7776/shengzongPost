// app/api/comments/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/auth'
import { updateCommentStatus, deleteComment } from '@/lib/db'

// PATCH /api/comments/[id]  body: { action: 'approve' | 'reject' }
export async function PATCH(
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

    const comment = await updateCommentStatus(id, action === 'approve' ? 'approved' : 'rejected')
    return NextResponse.json(comment)
  } catch (err) {
    console.error('[comments PATCH]', err)
    return NextResponse.json({ error: '操作失败' }, { status: 500 })
  }
}

// ✅ 新增：DELETE /api/comments/[id]
export async function DELETE(
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
    console.error('[comments DELETE]', err)
    return NextResponse.json({ error: '删除失败' }, { status: 500 })
  }
}
