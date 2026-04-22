// app/api/posts/view/route.ts
// POST /api/posts/view  → 增加文章访问次数（前端静默调用，防止重复计数）
import { NextRequest, NextResponse } from 'next/server'
import { incrementViewCount } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const { slug } = await req.json()
    if (!slug || typeof slug !== 'string') {
      return NextResponse.json({ error: '缺少 slug' }, { status: 400 })
    }
    await incrementViewCount(slug)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[view POST]', err)
    return NextResponse.json({ error: '记录失败' }, { status: 500 })
  }
}
