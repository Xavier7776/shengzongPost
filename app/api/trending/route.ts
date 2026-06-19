// app/api/trending/route.ts
// GET /api/trending?period=daily&limit=30
import { NextRequest, NextResponse } from 'next/server'
import { getTrending, getGrowthRanking, getTrendingLanguages } from '@/lib/db-trending'

export const dynamic = 'force-dynamic'
// 5 分钟内 CDN 直接返回缓存，10 分钟内允许返回旧数据同时后台刷新
const CACHE_CONTROL = 'public, s-maxage=300, stale-while-revalidate=600'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const period = (searchParams.get('period') || 'daily') as 'daily' | 'weekly' | 'growth'
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '30', 10)))

    if (!['daily', 'weekly', 'growth'].includes(period)) {
      return NextResponse.json({ error: 'Invalid period' }, { status: 400 })
    }

    let result
    if (period === 'growth') {
      const trending = await getGrowthRanking(limit)
      result = { trending, crawledAt: trending[0]?.crawled_at || null }
    } else {
      result = await getTrending(period, limit)
    }

    const languages = await getTrendingLanguages(period)

    return NextResponse.json(
      {
        trending: result.trending,
        period,
        crawledAt: result.crawledAt,
        total: result.trending.length,
        languages,
      },
      {
        headers: {
          'Cache-Control': CACHE_CONTROL,
        },
      }
    )
  } catch (err) {
    console.error('[trending GET]', err)
    return NextResponse.json({ error: '读取失败' }, { status: 500 })
  }
}
