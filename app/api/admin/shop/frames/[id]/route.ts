import { logFailure } from '@/lib/security/log'
import { withWriteGuard } from '@/lib/security/write-guard'
// app/api/admin/shop/frames/[id]/route.ts
// PATCH  /api/admin/shop/frames/:id → 更新
// DELETE /api/admin/shop/frames/:id → 删除
import { NextRequest, NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/auth'
import { updateFrame, deleteFrame, type AvatarFrameInput } from '@/lib/db'

export const dynamic = 'force-dynamic'

async function handlePATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!await requireAdminApi()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const id = Number((await params).id)
    if (!id) return NextResponse.json({ error: '参数错误' }, { status: 400 })

    const body = (await req.json()) as Partial<AvatarFrameInput>
    if (body.rarity && !['common', 'rare', 'epic', 'legendary'].includes(body.rarity)) {
      return NextResponse.json({ error: '稀有度必须是 common/rare/epic/legendary' }, { status: 400 })
    }

    const frame = await updateFrame(id, body)
    return NextResponse.json({ success: true, frame })
  } catch (err) {
    const message = err instanceof Error ? err.message : '更新失败'
    logFailure('app/api/admin/shop/frames/[id]', err)
    return NextResponse.json({ error: '操作失败，请稍后再试' }, { status: 500 })
  }
}

async function handleDELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!await requireAdminApi()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const id = Number((await params).id)
    if (!id) return NextResponse.json({ error: '参数错误' }, { status: 400 })

    await deleteFrame(id)
    return NextResponse.json({ success: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : '删除失败'
    logFailure('app/api/admin/shop/frames/[id]', err)
    return NextResponse.json({ error: '操作失败，请稍后再试' }, { status: 500 })
  }
}

export const PATCH = withWriteGuard(handlePATCH)
export const DELETE = withWriteGuard(handleDELETE)
