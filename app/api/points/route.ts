// app/api/points/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
export const dynamic = 'force-dynamic'
import { authOptions } from '@/lib/authOptions'
import { getPoints, getPointHistory } from '@/lib/db'

// GET /api/points          → 当前用户积分 + 流水
// GET /api/points?userId=x → 指定用户积分（仅公开余额）
export async function GET(req: NextRequest) {
  const userIdParam = req.nextUrl.searchParams.get('userId')

  try {
    if (userIdParam) {
      const points = await getPoints(Number(userIdParam))
      return NextResponse.json({ points }, { headers: { 'Cache-Control': 'no-store' } })
    }

    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: '未登录' }, { status: 401 })
    const userId = Number((session.user as { id?: string }).id)
    if (!userId) return NextResponse.json({ error: '用户信息异常' }, { status: 400 })

    const [points, history] = await Promise.all([
      getPoints(userId),
      getPointHistory(userId, 30),
    ])

    return NextResponse.json({ points, history }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (err) {
    console.error('[points GET]', err)
    return NextResponse.json({ error: '查询失败' }, { status: 500 })
  }
}
