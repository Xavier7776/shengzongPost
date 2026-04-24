// app/api/user/posts/route.ts
// GET /api/user/posts?userId=xxx → 返回该用户发布的文章列表
import { NextRequest, NextResponse } from 'next/server'
import { getPostsByAuthor } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const userId = Number(req.nextUrl.searchParams.get('userId') ?? 0)
  if (!userId) return NextResponse.json({ error: '缺少 userId' }, { status: 400 })
  try {
    const posts = await getPostsByAuthor(userId)
    return NextResponse.json(posts)
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: '查询失败' }, { status: 500 })
  }
}
