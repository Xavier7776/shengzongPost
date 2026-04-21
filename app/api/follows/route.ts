// app/api/follows/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { toggleFollow, getFollowStatus, getFollowing, getFollowers, getFollowCounts } from '@/lib/db'

// GET /api/follows?targetId=xxx          → { isFollowing, isMutual, following, followers }
// GET /api/follows?userId=xxx&list=following|followers
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  const params = req.nextUrl.searchParams
  const targetId = params.get('targetId')
  const userId = params.get('userId')
  const list = params.get('list')

  try {
    if (userId && list) {
      const id = Number(userId)
      if (list === 'following') return NextResponse.json(await getFollowing(id))
      if (list === 'followers') return NextResponse.json(await getFollowers(id))
    }

    if (targetId) {
      const tId = Number(targetId)
      const counts = await getFollowCounts(tId)
      if (!session?.user) return NextResponse.json({ isFollowing: false, isMutual: false, ...counts })
      const myId = Number((session.user as { id?: string }).id)
      const status = await getFollowStatus(myId, tId)
      return NextResponse.json({ ...status, ...counts })
    }

    return NextResponse.json({ error: '参数错误' }, { status: 400 })
  } catch (err) {
    console.error('[follows GET]', err)
    return NextResponse.json({ error: '读取失败' }, { status: 500 })
  }
}

// POST /api/follows  body: { targetId }
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: '请先登录' }, { status: 401 })
  const myId = Number((session.user as { id?: string }).id)
  if (!myId) return NextResponse.json({ error: '用户信息异常' }, { status: 400 })

  try {
    const { targetId } = await req.json()
    if (!targetId || targetId === myId)
      return NextResponse.json({ error: '参数错误' }, { status: 400 })
    const status = await toggleFollow(myId, Number(targetId))
    const counts = await getFollowCounts(Number(targetId))
    return NextResponse.json({ ...status, ...counts })
  } catch (err) {
    console.error('[follows POST]', err)
    return NextResponse.json({ error: '操作失败' }, { status: 500 })
  }
}
