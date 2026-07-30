'use client'

// app/notifications/NotificationClient.tsx
// 通知中心客户端组件：处理标记已读、全部标记已读、加载更多

import { useState, useCallback } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  MessageCircle,
  FileText,
  Coins,
  Bell,
  CheckCheck,
  Loader2,
  Inbox,
} from 'lucide-react'
import type { Notification, NotificationType } from '@/lib/db'

interface NotificationClientProps {
  initialNotifications: Notification[]
}

// 通知类型 → 图标 + 颜色映射
const TYPE_CONFIG: Record<NotificationType, { icon: typeof MessageCircle; bg: string; fg: string }> = {
  comment_reply:  { icon: MessageCircle, bg: 'bg-blue-50',  fg: 'text-blue-600' },
  article_update: { icon: FileText,      bg: 'bg-violet-50', fg: 'text-violet-600' },
  points_change:  { icon: Coins,         bg: 'bg-amber-50',  fg: 'text-amber-600' },
  system:         { icon: Bell,          bg: 'bg-gray-100',  fg: 'text-gray-600' },
}

// 相对时间格式化（中文）
function formatRelativeTime(iso: string): string {
  const date = new Date(iso)
  const now = new Date()
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diff < 60) return '刚刚'
  if (diff < 3600) return `${Math.floor(diff / 60)} 分钟前`
  if (diff < 86400) return `${Math.floor(diff / 3600)} 小时前`
  if (diff < 2592000) return `${Math.floor(diff / 86400)} 天前`
  // 超过 30 天显示日期
  return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
}

export default function NotificationClient({ initialNotifications }: NotificationClientProps) {
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications)
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [markingAll, setMarkingAll] = useState(false)
  const [hasMore, setHasMore] = useState(initialNotifications.length >= 20)

  const unreadCount = notifications.filter(n => !n.is_read).length

  // 标记单条通知为已读
  const handleMarkAsRead = useCallback(async (id: string) => {
    // 乐观更新：立即在 UI 标记已读
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, is_read: true } : n))
    )
    try {
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notification_id: id }),
      })
    } catch (err) {
      console.error('[markAsRead]', err)
    }
  }, [])

  // 标记所有通知为已读
  const handleMarkAllAsRead = useCallback(async () => {
    if (unreadCount === 0 || markingAll) return
    setMarkingAll(true)
    // 乐观更新
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    try {
      await fetch('/api/notifications/read-all', { method: 'POST' })
    } catch (err) {
      console.error('[markAllAsRead]', err)
    } finally {
      setMarkingAll(false)
    }
  }, [unreadCount, markingAll])

  // 点击通知：标记已读 + 跳转
  const handleClickNotification = useCallback(
    (notification: Notification) => {
      if (!notification.is_read) handleMarkAsRead(notification.id)
      // link 通过 <Link> 自然跳转，无需手动 router.push
    },
    [handleMarkAsRead]
  )

  // 加载更多
  const handleLoadMore = useCallback(async () => {
    if (loadingMore) return
    setLoadingMore(true)
    try {
      const page = Math.floor(notifications.length / 20) + 1
      const resp = await fetch(`/api/notifications?page=${page}&pageSize=20`)
      if (!resp.ok) throw new Error('加载失败')
      const data = await resp.json()
      const next: Notification[] = data.notifications ?? []
      setNotifications(prev => [...prev, ...next])
      if (next.length < 20) setHasMore(false)
    } catch (err) {
      console.error('[loadMore]', err)
    } finally {
      setLoadingMore(false)
    }
  }, [notifications.length, loadingMore])

  return (
    <>
      {/* 顶部标题栏 */}
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-xs font-black tracking-widest text-gray-400 hover:text-gray-900 transition-colors mb-8"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        返回首页
      </Link>

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">通知中心</h1>
          {unreadCount > 0 && (
            <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-white text-[11px] font-bold">
              {unreadCount}
            </span>
          )}
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            disabled={markingAll}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-gray-900 disabled:opacity-50 transition-colors"
          >
            {markingAll ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <CheckCheck className="w-3.5 h-3.5" />
            )}
            全部标记已读
          </button>
        )}
      </div>

      {/* 通知列表 */}
      {notifications.length === 0 && !loading ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
            <Inbox className="w-7 h-7 text-gray-300" />
          </div>
          <p className="text-sm font-bold text-gray-400">暂无通知</p>
          <p className="text-xs text-gray-300 mt-1">新的消息会显示在这里</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map(notification => {
            const config = TYPE_CONFIG[notification.type] ?? TYPE_CONFIG.system
            const Icon = config.icon
            const content = (
              <div
                onClick={() => handleClickNotification(notification)}
                className={`group flex items-start gap-3 p-4 rounded-2xl border transition-all duration-200 cursor-pointer ${
                  notification.is_read
                    ? 'bg-white border-gray-100 hover:border-gray-200'
                    : 'bg-blue-50/40 border-blue-100 hover:border-blue-200'
                }`}
              >
                {/* 类型图标 */}
                <div className={`flex-shrink-0 w-9 h-9 rounded-xl ${config.bg} flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${config.fg}`} />
                </div>

                {/* 内容区 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={`text-sm truncate ${notification.is_read ? 'font-bold text-gray-600' : 'font-black text-gray-900'}`}>
                      {notification.title}
                    </p>
                    {!notification.is_read && (
                      <span className="flex-shrink-0 w-2 h-2 rounded-full bg-red-500" />
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">{notification.content}</p>
                  <p className="text-[11px] text-gray-300 mt-1.5">{formatRelativeTime(notification.created_at)}</p>
                </div>
              </div>
            )

            // 有 link 则可点击跳转
            return notification.link ? (
              <Link key={notification.id} href={notification.link} className="block">
                {content}
              </Link>
            ) : (
              <div key={notification.id}>{content}</div>
            )
          })}
        </div>
      )}

      {/* 加载更多 */}
      {hasMore && notifications.length > 0 && (
        <div className="mt-6 flex justify-center">
          <button
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-gray-600 bg-white border border-gray-200 hover:border-gray-300 hover:text-gray-900 disabled:opacity-50 transition-colors"
          >
            {loadingMore ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                加载中
              </>
            ) : (
              '加载更多'
            )}
          </button>
        </div>
      )}
    </>
  )
}
