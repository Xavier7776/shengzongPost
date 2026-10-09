// app/api/search/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { searchAll } from '@/lib/db-search'
import { parseSearchParams } from '@/lib/search'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  let query
  try {
    query = parseSearchParams(req.nextUrl.searchParams)
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 })
  }

  try {
    return NextResponse.json(await searchAll(query))
  } catch (err) {
    console.error('[search] error:', err)
    return NextResponse.json(
      { error: '搜索失败，请稍后重试' },
      { status: 500 }
    )
  }
}
