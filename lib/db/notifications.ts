// lib/db/notifications.ts
// Extracted from lib/db.ts by domain boundary. Logic unchanged.

import { sql, serializeRow, serializeRows } from './_core'

// ─── Notifications (站内通知中心) ────────────────────────────────────────────

export type NotificationType = 'comment_reply' | 'article_update' | 'points_change' | 'system'

export interface Notification {
  id: string
  user_id: number
  type: NotificationType
  title: string
  content: string
  link: string | null
  is_read: boolean
  created_at: string
}

/** 获取用户的通知列表（分页，最新在前） */
export async function getNotifications(
  userId: number,
  limit = 20,
  offset = 0
): Promise<Notification[]> {
  const rows = await sql`
    SELECT id, user_id, type, title, content, link, is_read, created_at
    FROM notifications
    WHERE user_id = ${userId}
    ORDER BY created_at DESC
    LIMIT ${limit} OFFSET ${offset}
  `
  return serializeRows(rows as Record<string, unknown>[]) as unknown as Notification[]
}

/** 获取用户未读通知数量 */
export async function getUnreadNotificationCount(userId: number): Promise<number> {
  const rows = await sql`SELECT COUNT(*)::int as cnt FROM notifications WHERE user_id = ${userId} AND is_read = false`
  return (rows[0] as { cnt: number }).cnt
}

/** 标记单条通知为已读（仅限本人通知） */
export async function markNotificationAsRead(notificationId: string, userId: number): Promise<boolean> {
  const rows = await sql`
    UPDATE notifications SET is_read = true
    WHERE id = ${notificationId}::uuid AND user_id = ${userId} AND is_read = false
    RETURNING id
  `
  return rows.length > 0
}

/** 标记用户所有通知为已读 */
export async function markAllNotificationsAsRead(userId: number): Promise<number> {
  const rows = await sql`
    UPDATE notifications SET is_read = true
    WHERE user_id = ${userId} AND is_read = false
    RETURNING id
  `
  return rows.length
}

