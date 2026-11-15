'use client'

// components/layout/NotificationBell.tsx
// 导航栏通知铃铛：显示未读数量 badge，点击跳转 /notifications
// 通过 fetch 获取未读数（初始化 + 轮询）

import { useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Bell } from 'lucide-react'
import { useJsonResource } from '@/shared/use-json-resource'

interface NotificationBellProps {
  dark?: boolean
}

// 轮询间隔（毫秒）：60 秒
const POLL_INTERVAL = 60_000

export default function NotificationBell({ dark = false }: NotificationBellProps) {
  const { status, data: session } = useSession()
  const pathname = usePathname()
  const { data, reload } = useJsonResource<{ count: number }>(
    status === 'authenticated' ? '/api/notifications/unread-count' : null,
    { count: 0 }, `${(session?.user as { id?: string } | undefined)?.id ?? ''}:${pathname}`,
  )
  const unread = pathname === '/notifications' ? 0 : typeof data.count === 'number' ? data.count : 0
  useEffect(() => {
    if (status !== 'authenticated') return
    const timer = setInterval(reload, POLL_INTERVAL)
    return () => clearInterval(timer)
  }, [status, reload])

  // 未登录不显示
  if (status !== 'authenticated') return null

  return (
    <Link
      href="/notifications"
      className="relative flex items-center justify-center w-9 h-9 rounded-xl transition-colors"
      title="通知"
      aria-label="通知"
    >
      <Bell className={`w-[18px] h-[18px] ${dark ? 'text-white/50 hover:text-white' : 'text-gray-400 hover:text-gray-900'} transition-colors`} />
      {unread > 0 && (
        <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-black leading-none ring-2 ring-white dark:ring-[#0f0f0f]">
          {unread > 99 ? '99+' : unread}
        </span>
      )}
    </Link>
  )
}
