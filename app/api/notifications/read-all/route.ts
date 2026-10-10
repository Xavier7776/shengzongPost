import { logFailure } from '@/lib/security/log'
import { withWriteGuard } from '@/lib/security/write-guard'
// app/api/notifications/read-all/route.ts
// POST /api/notifications/read-all → 标记当前用户所有通知为已读

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { markAllNotificationsAsRead } from '@/lib/db'

async function handlePOST() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: '请先登录' }, { status: 401 })

  const userId = Number((session.user as { id?: string }).id)
  if (!userId) return NextResponse.json({ error: '用户信息异常' }, { status: 400 })

  try {
    const updated = await markAllNotificationsAsRead(userId)
    return NextResponse.json({ ok: true, updated })
  } catch (err) {
    logFailure('app/api/notifications/read-all', err)
    return NextResponse.json({ error: '操作失败' }, { status: 500 })
  }
}

export const POST = withWriteGuard(handlePOST)
