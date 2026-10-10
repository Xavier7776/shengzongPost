import { logFailure } from '@/lib/security/log'
// app/api/posts/public/route.ts
// GET /api/posts/public → 返回所有已发布文章的元信息（无需登录）
import { NextRequest, NextResponse } from 'next/server'
import { getAllPosts, getPostsPaginated } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const limit = req.nextUrl.searchParams.get('limit')
  if (limit !== null && (!/^\d+$/.test(limit) || Number(limit) < 1 || Number(limit) > 50)) {
    return NextResponse.json({ error: '无效的数量' }, { status: 400 })
  }
  try {
    const posts = limit === null ? await getAllPosts() : (await getPostsPaginated(1, Number(limit))).posts
    return NextResponse.json(posts)
  } catch (err) {
    logFailure('app/api/posts/public', err)
    return NextResponse.json({ error: '读取失败' }, { status: 500 })
  }
}
