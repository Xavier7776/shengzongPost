// app/api/research/points/route.ts
// 深度研究积分系统：2000 积分 / 次
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
export const dynamic = 'force-dynamic'
import { authOptions } from '@/lib/authOptions'
import { getPoints, addPoints, sql } from '@/lib/db'

const RESEARCH_COST = 2000

// GET /api/research/points → 当前用户积分 + 单次费用
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: '未登录' }, { status: 401 })
    const userId = Number((session.user as { id?: string }).id)
    if (!userId) return NextResponse.json({ error: '用户信息异常' }, { status: 400 })

    const points = await getPoints(userId)
    return NextResponse.json({
      points,
      cost: RESEARCH_COST,
      canUse: points >= RESEARCH_COST,
    }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (err) {
    console.error('[research/points GET]', err)
    return NextResponse.json({ error: '查询失败' }, { status: 500 })
  }
}

// POST /api/research/points → 扣除 2000 积分启动深度研究
export async function POST() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: '未登录' }, { status: 401 })
    const userId = Number((session.user as { id?: string }).id)
    if (!userId) return NextResponse.json({ error: '用户信息异常' }, { status: 400 })

    // 原子性扣费：单条 SQL 同时检查余额+扣费，避免并发问题
    // WHERE points >= 2000 确保余额充足才扣，RETURNING 返回新余额
    const refSlug = `research_${Date.now()}_${userId}`
    const rows = await sql`
      UPDATE users
      SET points = points - ${RESEARCH_COST}
      WHERE id = ${userId} AND points >= ${RESEARCH_COST}
      RETURNING points
    `

    if (!rows[0]) {
      // 余额不足或用户不存在
      const currentRow = await sql`SELECT points FROM users WHERE id = ${userId} LIMIT 1`
      const current = (currentRow[0] as { points: number })?.points ?? 0
      return NextResponse.json({
        error: '积分不足',
        needed: RESEARCH_COST,
        current,
        shortage: RESEARCH_COST - current,
      }, { status: 402 })
    }

    const remaining = (rows[0] as { points: number }).points

    // 记录流水（失败不影响扣费结果）
    try {
      await sql`INSERT INTO point_transactions(user_id, amount, reason, ref_slug) VALUES(${userId}, ${-RESEARCH_COST}, 'deep_research', ${refSlug})`
    } catch (e) {
      console.error('[research/points POST] 流水记录失败（不影响扣费）:', e)
    }

    return NextResponse.json({
      success: true,
      remaining,
      cost: RESEARCH_COST,
      refSlug,
    }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (err) {
    console.error('[research/points POST]', err)
    return NextResponse.json({ error: '扣费失败: ' + String(err) }, { status: 500 })
  }
}
