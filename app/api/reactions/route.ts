import { logFailure } from '@/lib/security/log'
import { withWriteGuard } from '@/lib/security/write-guard'
// app/api/reactions/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { getPostReactions, toggleReaction } from '@/lib/db'

// GET /api/reactions?slug=xxx
export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get('slug')
  if (!slug) return NextResponse.json({ error: '缺少 slug' }, { status: 400 })
  const session = await getServerSession(authOptions)
  const userId = session?.user ? Number((session.user as { id?: string }).id) : undefined
  try {
    const data = await getPostReactions(slug, userId)
    return NextResponse.json(data)
  } catch (err) {
    logFailure('app/api/reactions', err)
    return NextResponse.json({ error: '读取失败' }, { status: 500 })
  }
}

// POST /api/reactions  body: { slug, type: 'like'|'dislike' }
// 如果当前已是该类型，则取消（toggle）
async function handlePOST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: '请先登录' }, { status: 401 })
  const userId = Number((session.user as { id?: string }).id)
  if (!userId) return NextResponse.json({ error: '用户信息异常' }, { status: 400 })

  try {
    const { slug, type } = await req.json()
    if (typeof slug !== 'string' || !slug || !['like', 'dislike'].includes(type))
      return NextResponse.json({ error: '参数错误' }, { status: 400 })

    await toggleReaction(slug, userId, type)
    return NextResponse.json(await getPostReactions(slug, userId))
  } catch (err) {
    if (err instanceof Error && err.message === 'Post not found') return NextResponse.json({ error: '文章不存在' }, { status: 404 })
    logFailure('app/api/reactions', err)
    return NextResponse.json({ error: '操作失败' }, { status: 500 })
  }
}

export const POST = withWriteGuard(handlePOST)
