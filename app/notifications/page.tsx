// app/notifications/page.tsx
// 通知中心 - 服务端组件：获取用户通知列表，未登录跳转登录页

import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { getNotifications } from '@/lib/db'
import NotificationClient from './NotificationClient'
import type { Notification } from '@/lib/db'

export const dynamic = 'force-dynamic'

export default async function NotificationsPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/login?callbackUrl=/notifications')

  const userId = Number((session.user as { id?: string }).id)
  if (!userId) redirect('/login?callbackUrl=/notifications')

  // 服务端预取第一页（20 条）
  const initialNotifications = await getNotifications(userId, 20, 0)

  return (
    <div className="min-h-screen bg-[#FAFAF8] pt-24 pb-20 px-4">
      <div className="max-w-2xl mx-auto">
        <NotificationClient initialNotifications={initialNotifications as Notification[]} />
      </div>
    </div>
  )
}
