// app/api/user/liked-posts/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getUserLikedPosts } from '@/lib/db'

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
