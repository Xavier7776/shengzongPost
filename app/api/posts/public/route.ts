// app/api/posts/public/route.ts
// GET /api/posts/public → 返回所有已发布文章的元信息（无需登录）
import { NextResponse } from 'next/server'
import { getAllPosts } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const posts = await getAllPosts()
    return NextResponse.json(posts)
  } catch (err) {
    console.error('[posts/public GET]', err)
    return NextResponse.json({ error: '读取失败' }, { status: 500 })
  }
}
