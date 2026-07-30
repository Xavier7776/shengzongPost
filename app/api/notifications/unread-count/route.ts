// app/api/notifications/unread-count/route.ts
// GET /api/notifications/unread-count → 获取当前用户未读通知数量

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { getUnreadNotificationCount } from '@/lib/db'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: '请先登录' }, { status: 401 })

  const userId = Number((session.user as { id?: string }).id)
  if (!userId) return NextResponse.json({ error: '用户信息异常' }, { status: 400 })

  try {
    const count = await getUnreadNotificationCount(userId)
    return NextResponse.json({ count })
  } catch (err) {
    console.error('[notifications unread-count GET]', err)
    return NextResponse.json({ error: '读取失败' }, { status: 500 })
  }
}
