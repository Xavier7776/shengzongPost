// app/api/user/liked-posts/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getUserLikedPosts } from '@/lib/db'

// 公开 GET 路由，未调用 cookies/headers 等动态 API，需显式声明动态
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const userId = Number(req.nextUrl.searchParams.get('userId'))
  if (!userId) return NextResponse.json({ error: '缺少 userId' }, { status: 400 })
  try {
    const posts = await getUserLikedPosts(userId)
    return NextResponse.json(posts)
  } catch (err) {
    console.error('[liked-posts GET]', err)
    return NextResponse.json({ error: '读取失败' }, { status: 500 })
  }
}
