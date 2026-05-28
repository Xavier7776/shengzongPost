// app/api/shop/frames/route.ts
// GET /api/shop/frames → 头像框目录 + 用户已购/装备状态
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { getAllFrames, getUserFrames, getPoints, getUserEquippedFrame } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const frames = await getAllFrames()
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ frames, purchased: [], equippedFrameId: null, points: 0 }, { headers: { 'Cache-Control': 'no-store' } })
    }

    const userId = Number((session.user as { id?: string }).id)
    const [purchased, equipped, points] = await Promise.all([
      getUserFrames(userId),
      getUserEquippedFrame(userId),
      getPoints(userId),
    ])

    return NextResponse.json({
      frames,
      purchased,
      equippedFrameId: equipped?.id ?? null,
      points,
    }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (err) {
    console.error('[shop frames GET]', err)
    return NextResponse.json({ error: '读取失败' }, { status: 500 })
  }
}
