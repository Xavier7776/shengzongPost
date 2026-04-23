// app/api/slides/[id]/route.ts
// PATCH  /api/slides/[id]  → 更新（标题/图片/排序/启用状态）
// DELETE /api/slides/[id]  → 删除

import { NextRequest, NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/auth'
import { updateHeroSlide, deleteHeroSlide } from '@/lib/db'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await requireAdminApi()
  if (!session) return NextResponse.json({ error: '无权限' }, { status: 401 })

  const id = Number(params.id)
  if (isNaN(id)) return NextResponse.json({ error: '参数错误' }, { status: 400 })

  try {
    const data = await req.json()
    const slide = await updateHeroSlide(id, data)
    return NextResponse.json({ ok: true, slide })
  } catch (err) {
    console.error('[slides PATCH]', err)
    return NextResponse.json({ error: '更新失败' }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await requireAdminApi()
  if (!session) return NextResponse.json({ error: '无权限' }, { status: 401 })

  const id = Number(params.id)
  if (isNaN(id)) return NextResponse.json({ error: '参数错误' }, { status: 400 })

  try {
    await deleteHeroSlide(id)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[slides DELETE]', err)
    return NextResponse.json({ error: '删除失败' }, { status: 500 })
  }
}
