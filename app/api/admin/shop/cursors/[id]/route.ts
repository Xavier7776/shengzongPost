import { logFailure } from '@/lib/security/log'
import { withWriteGuard } from '@/lib/security/write-guard'
// app/api/admin/shop/cursors/[id]/route.ts
// PATCH /api/admin/shop/cursors/:id → 更新
// DELETE /api/admin/shop/cursors/:id → 删除
import { NextRequest, NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/auth'
import { updateCursorEffect, deleteCursorEffect, type CursorEffectInput } from '@/lib/db'

export const dynamic = 'force-dynamic'

async function handlePATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!await requireAdminApi()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const id = Number(params.id)
    if (!id) return NextResponse.json({ error: '参数错误' }, { status: 400 })

    const body = (await req.json()) as Partial<CursorEffectInput>
    if (body.rarity && !['common', 'rare', 'epic', 'legendary'].includes(body.rarity)) {
      return NextResponse.json({ error: '稀有度必须是 common/rare/epic/legendary' }, { status: 400 })
    }
    if (body.render_type && !['sprite_sheet', 'gif'].includes(body.render_type)) {
      return NextResponse.json({ error: 'render_type 必须是 sprite_sheet 或 gif' }, { status: 400 })
    }

    const effect = await updateCursorEffect(id, body)
    return NextResponse.json({ success: true, effect })
  } catch (err) {
    const message = err instanceof Error ? err.message : '更新失败'
    logFailure('app/api/admin/shop/cursors/[id]', err)
    return NextResponse.json({ error: '操作失败，请稍后再试' }, { status: 500 })
  }
}

async function handleDELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!await requireAdminApi()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const id = Number(params.id)
    if (!id) return NextResponse.json({ error: '参数错误' }, { status: 400 })

    await deleteCursorEffect(id)
    return NextResponse.json({ success: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : '删除失败'
    logFailure('app/api/admin/shop/cursors/[id]', err)
    return NextResponse.json({ error: '操作失败，请稍后再试' }, { status: 500 })
  }
}

export const PATCH = withWriteGuard(handlePATCH)
export const DELETE = withWriteGuard(handleDELETE)
