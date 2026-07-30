// app/api/analytics/stats/route.ts
// GET /api/analytics/stats?range=7d|30d|90d|all  → 获取访客统计数据（需要管理员权限）
import { NextRequest, NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/auth'
import {
  getVisitorStats,
  getVisitorDailyTrend,
  getTopPages,
  getTopReferrers,
  type VisitorRange,
} from '@/lib/db'

// 合法 range 值白名单
const VALID_RANGES: VisitorRange[] = ['7d', '30d', '90d', 'all']

export async function GET(req: NextRequest) {
  // 鉴权：仅管理员可查询统计数据
  const session = await requireAdminApi()
  if (!session) {
    return NextResponse.json({ error: '未授权' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(req.url)
    const rangeParam = searchParams.get('range') || '7d'
    const range: VisitorRange = VALID_RANGES.includes(rangeParam as VisitorRange)
      ? (rangeParam as VisitorRange)
      : '7d'

    // 并发查询所有统计维度
    const [stats, dailyTrend, topPages, topReferrers] = await Promise.all([
      getVisitorStats(range),
      getVisitorDailyTrend(range),
      getTopPages(range, 10),
      getTopReferrers(range, 10),
    ])

    return NextResponse.json({
      range,
      stats,
      dailyTrend,
      topPages,
      topReferrers,
    })
  } catch (err) {
    console.error('[analytics/stats GET]', err)
    return NextResponse.json({ error: '查询失败' }, { status: 500 })
  }
}
