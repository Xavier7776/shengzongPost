// app/api/search/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { searchAll } from '@/lib/db-search'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim() ?? ''
  const limit = Math.min(30, Math.max(1, parseInt(req.nextUrl.searchParams.get('limit') ?? '20', 10)))

  if (!q) {
    return NextResponse.json({ results: [], total: 0, q: '' })
  }

  try {
    const results = await searchAll(q, limit)
    return NextResponse.json({ results, total: results.length, q })
  } catch (err) {
    console.error('[search] error:', err)
    return NextResponse.json(
      { results: [], total: 0, q, error: '搜索失败' },
      { status: 500 }
    )
  }
}
