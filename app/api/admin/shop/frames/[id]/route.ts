// app/api/admin/shop/frames/[id]/route.ts
// PATCH  /api/admin/shop/frames/:id → 更新
// DELETE /api/admin/shop/frames/:id → 删除
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { updateFrame, deleteFrame, type AvatarFrameInput } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin()
    const id = Number(params.id)
    if (!id) return NextResponse.json({ error: '参数错误' }, { status: 400 })

    const body = (await req.json()) as Partial<AvatarFrameInput>
    if (body.rarity && !['common', 'rare', 'epic', 'legendary'].includes(body.rarity)) {
      return NextResponse.json({ error: '稀有度必须是 common/rare/epic/legendary' }, { status: 400 })
    }

    const frame = await updateFrame(id, body)
    return NextResponse.json({ success: true, frame })
  } catch (err) {
    const message = err instanceof Error ? err.message : '更新失败'
    console.error('[admin shop frames PATCH]', err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin()
    const id = Number(params.id)
    if (!id) return NextResponse.json({ error: '参数错误' }, { status: 400 })

    await deleteFrame(id)
    return NextResponse.json({ success: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : '删除失败'
    console.error('[admin shop frames DELETE]', err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
