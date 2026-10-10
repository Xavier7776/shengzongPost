import { logFailure } from '@/lib/security/log'
import { withWriteGuard } from '@/lib/security/write-guard'
// app/api/research/points/route.ts
// 深度研究积分系统：2000 积分 / 次
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
export const dynamic = 'force-dynamic'
import { authOptions } from '@/lib/authOptions'
import { getPoints, chargeResearch } from '@/lib/db'

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
    logFailure('app/api/research/points', err)
    return NextResponse.json({ error: '查询失败' }, { status: 500 })
  }
}

// POST /api/research/points → 扣除 2000 积分启动深度研究
async function handlePOST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: '未登录' }, { status: 401 })
    const userId = Number((session.user as { id?: string }).id)
    if (!userId) return NextResponse.json({ error: '用户信息异常' }, { status: 400 })

    // Cached old clients sent no body; only clients retaining a requestId can replay safely.
    const body = await req.text()
    let requestId: unknown = crypto.randomUUID()
    if (body) {
      try { requestId = JSON.parse(body)?.requestId }
      catch { return NextResponse.json({ error: '请求格式无效' }, { status: 400 }) }
    }
    if (typeof requestId !== 'string' || !/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(requestId)) {
      return NextResponse.json({ error: '请求编号无效' }, { status: 400 })
    }
    const { paid, remaining, refSlug } = await chargeResearch(userId, requestId.toLowerCase(), RESEARCH_COST)
    if (!paid) {
      const current = remaining
      return NextResponse.json({
        error: '积分不足',
        needed: RESEARCH_COST,
        current,
        shortage: RESEARCH_COST - current,
      }, { status: 402 })
    }

    return NextResponse.json({
      success: true,
      remaining,
      cost: RESEARCH_COST,
      refSlug,
    }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (err) {
    logFailure('app/api/research/points', err)
    return NextResponse.json({ error: '扣费失败，请稍后再试' }, { status: 500 })
  }
}

export const POST = withWriteGuard(handlePOST)
