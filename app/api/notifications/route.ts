// app/api/notifications/route.ts
// GET  /api/notifications?page=1&pageSize=20  → 获取当前用户的通知列表（分页，最新在前）
// POST /api/notifications                    → 标记单条通知为已读（接收 notification_id）

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { getNotifications, markNotificationAsRead } from '@/lib/db'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: '请先登录' }, { status: 401 })

  const userId = Number((session.user as { id?: string }).id)
  if (!userId) return NextResponse.json({ error: '用户信息异常' }, { status: 400 })

  try {
    const page = Math.max(1, Number(req.nextUrl.searchParams.get('page') ?? '1'))
    const pageSize = Math.min(50, Math.max(1, Number(req.nextUrl.searchParams.get('pageSize') ?? '20')))
    const offset = (page - 1) * pageSize

    const notifications = await getNotifications(userId, pageSize, offset)
    return NextResponse.json({ notifications, page, pageSize })
  } catch (err) {
    console.error('[notifications GET]', err)
    return NextResponse.json({ error: '读取失败' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: '请先登录' }, { status: 401 })

  const userId = Number((session.user as { id?: string }).id)
  if (!userId) return NextResponse.json({ error: '用户信息异常' }, { status: 400 })

  try {
    const { notification_id } = await req.json()
    if (!notification_id || typeof notification_id !== 'string')
      return NextResponse.json({ error: '缺少 notification_id' }, { status: 400 })

    const updated = await markNotificationAsRead(notification_id, userId)
    return NextResponse.json({ ok: true, updated })
  } catch (err) {
    console.error('[notifications POST]', err)
    return NextResponse.json({ error: '操作失败' }, { status: 500 })
  }
}
