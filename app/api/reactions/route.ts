// app/api/reactions/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { getPostReactions, upsertReaction, deleteReaction, addPoints, hasPointTransaction } from '@/lib/db'

// GET /api/reactions?slug=xxx
export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get('slug')
  if (!slug) return NextResponse.json({ error: '缺少 slug' }, { status: 400 })
  const session = await getServerSession(authOptions)
  const userId = session ? Number((session.user as { id?: string }).id) : undefined
  try {
    const data = await getPostReactions(slug, userId)
    return NextResponse.json(data)
  } catch (err) {
    console.error('[reactions GET]', err)
    return NextResponse.json({ error: '读取失败' }, { status: 500 })
  }
}

// POST /api/reactions  body: { slug, type: 'like'|'dislike' }
// 如果当前已是该类型，则取消（toggle）
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: '请先登录' }, { status: 401 })
  const userId = Number((session.user as { id?: string }).id)
  if (!userId) return NextResponse.json({ error: '用户信息异常' }, { status: 400 })

  try {
    const { slug, type } = await req.json()
    if (!slug || !['like', 'dislike'].includes(type))
      return NextResponse.json({ error: '参数错误' }, { status: 400 })

    const current = await getPostReactions(slug, userId)
    if (current.userReaction === type) {
      // 再次点击同一按钮 → 取消
      await deleteReaction(slug, userId)
      if (type === 'like') {
        // 只有之前确实加过积分才扣回（幂等）
        const hasTx = await hasPointTransaction(userId, 'like_post', slug)
        if (hasTx) await addPoints(userId, -1, 'unlike_post', slug)
      }
    } else {
      // 切换反应：如果之前是 like 现在改成 dislike，要扣回 like 的积分
      if (current.userReaction === 'like') {
        const hasTx = await hasPointTransaction(userId, 'like_post', slug)
        if (hasTx) await addPoints(userId, -1, 'unlike_post', slug)
      }
      await upsertReaction(slug, userId, type)
      if (type === 'like') {
        // 检查是否已有 like_post 流水，防止并发重复加分
        const alreadyLiked = await hasPointTransaction(userId, 'like_post', slug)
        if (!alreadyLiked) await addPoints(userId, 1, 'like_post', slug)
      }
    }
    return NextResponse.json(await getPostReactions(slug, userId))
  } catch (err) {
    console.error('[reactions POST]', err)
    return NextResponse.json({ error: '操作失败' }, { status: 500 })
  }
}
