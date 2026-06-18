// app/api/shop/cursors/route.ts
// GET /api/shop/cursors → 鼠标效果目录 + 用户已购/装备状态
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { getAllCursorEffects, getUserCursorEffects, getPoints, getUserEquippedCursorEffect } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const effects = await getAllCursorEffects()
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ effects, purchased: [], equippedEffectId: null, points: 0 }, { headers: { 'Cache-Control': 'no-store' } })
    }

    const userId = Number((session.user as { id?: string }).id)
    const [purchased, equipped, points] = await Promise.all([
      getUserCursorEffects(userId),
      getUserEquippedCursorEffect(userId),
      getPoints(userId),
    ])

    return NextResponse.json({
      effects,
      purchased,
      equippedEffectId: equipped?.id ?? null,
      points,
    }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (err) {
    console.error('[shop cursors GET]', err)
    return NextResponse.json({ error: '读取失败' }, { status: 500 })
  }
}
