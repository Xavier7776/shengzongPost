// app/api/bookmarks/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { isBookmarked, toggleBookmark, getUserBookmarks, addPoints, hasPointTransaction } from '@/lib/db'

// GET /api/bookmarks?slug=xxx  → { bookmarked: bool }
// GET /api/bookmarks            → [ ...posts ]  用户收藏列表
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: '请先登录' }, { status: 401 })
  const userId = Number((session.user as { id?: string }).id)

  const slug = req.nextUrl.searchParams.get('slug')
  try {
    if (slug) {
      const bookmarked = await isBookmarked(slug, userId)
      return NextResponse.json({ bookmarked })
    }
    const posts = await getUserBookmarks(userId)
    return NextResponse.json(posts)
  } catch (err) {
    console.error('[bookmarks GET]', err)
    return NextResponse.json({ error: '读取失败' }, { status: 500 })
  }
}

// POST /api/bookmarks  body: { slug }  → { bookmarked: bool }
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: '请先登录' }, { status: 401 })
  const userId = Number((session.user as { id?: string }).id)
  if (!userId) return NextResponse.json({ error: '用户信息异常' }, { status: 400 })

  try {
    const { slug } = await req.json()
    if (!slug) return NextResponse.json({ error: '缺少 slug' }, { status: 400 })
    const bookmarked = await toggleBookmark(slug, userId)
    if (bookmarked) {
      // 检查是否已有收藏流水，防止并发重复加分
      const alreadyBookmarked = await hasPointTransaction(userId, 'bookmark_post', slug)
      if (!alreadyBookmarked) await addPoints(userId, 1, 'bookmark_post', slug)
    } else {
      // 只有之前确实加过积分才扣回（幂等）
      const hasTx = await hasPointTransaction(userId, 'bookmark_post', slug)
      if (hasTx) await addPoints(userId, -1, 'unbookmark_post', slug)
    }
    return NextResponse.json({ bookmarked })
  } catch (err) {
    console.error('[bookmarks POST]', err)
    return NextResponse.json({ error: '操作失败' }, { status: 500 })
  }
}
