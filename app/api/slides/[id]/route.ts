import { logFailure } from '@/lib/security/log'
import { withWriteGuard } from '@/lib/security/write-guard'
// app/api/slides/[id]/route.ts
// PATCH  /api/slides/[id]  → 更新（标题/图片/排序/启用状态）
// DELETE /api/slides/[id]  → 删除

import { NextRequest, NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/auth'
import { updateHeroSlide, deleteHeroSlide } from '@/lib/db'

async function handlePATCH(
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
    logFailure('app/api/slides/[id]', err)
    return NextResponse.json({ error: '更新失败' }, { status: 500 })
  }
}

async function handleDELETE(
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
    logFailure('app/api/slides/[id]', err)
    return NextResponse.json({ error: '删除失败' }, { status: 500 })
  }
}

export const PATCH = withWriteGuard(handlePATCH)
export const DELETE = withWriteGuard(handleDELETE)
