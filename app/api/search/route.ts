import { logFailure } from '@/lib/security/log'
// app/api/search/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { searchAll } from '@/lib/db-search'
import { parseSearchParams } from '@/lib/search'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

export async function GET(req: NextRequest) {
  let query
  try {
    query = parseSearchParams(req.nextUrl.searchParams)
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 })
  }

  try {
    const started = performance.now()
    const result = await searchAll(query)
    return NextResponse.json(result, {
      // Includes Neon network/retries; database EXPLAIN and browser RTT are separate measurements.
      headers: { 'Server-Timing': `search;dur=${(performance.now() - started).toFixed(1)}` },
    })
  } catch (err) {
    logFailure('app/api/search', err)
    return NextResponse.json(
      { error: '搜索失败，请稍后重试' },
      { status: 500 }
    )
  }
}
