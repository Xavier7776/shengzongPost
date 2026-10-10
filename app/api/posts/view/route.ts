import { logFailure } from '@/lib/security/log'
import { withWriteGuard } from '@/lib/security/write-guard'
// app/api/posts/view/route.ts
// POST /api/posts/view  → 增加文章访问次数（前端静默调用，防止重复计数）
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { incrementViewCount, rewardPostRead } from '@/lib/db'

async function handlePOST(req: NextRequest) {
  try {
    const { slug } = await req.json()
    if (!slug || typeof slug !== 'string') {
      return NextResponse.json({ error: '缺少 slug' }, { status: 400 })
    }
    await incrementViewCount(slug)

    // 已登录用户首次完整阅读获得积分
    let pointsAdded = false
    const session = await getServerSession(authOptions)
    if (session?.user) {
      const userId = Number((session.user as { id?: string }).id)
      if (userId) {
        pointsAdded = await rewardPostRead(userId, slug)
      }
    }

    return NextResponse.json({ ok: true, pointsAdded })
  } catch (err) {
    logFailure('app/api/posts/view', err)
    return NextResponse.json({ error: '记录失败' }, { status: 500 })
  }
}

export const POST = withWriteGuard(handlePOST)
