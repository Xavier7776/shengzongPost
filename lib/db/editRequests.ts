// lib/db/editRequests.ts
// Extracted from lib/db.ts by domain boundary. Logic unchanged.

import { sql, serializeRow, serializeRows } from './_core'

// ─── Post Edit Requests ───────────────────────────────────────────────────────
export interface PostEditRequest {
  id: number
  post_slug: string
  user_id: number
  title: string
  excerpt: string
  content: string
  tags: string[]
  cover_image: string | null
  status: 'pending' | 'approved' | 'rejected'
  admin_note: string | null
  created_at: string
  reviewed_at: string | null
}
export interface PostEditRequestWithUser extends PostEditRequest {
  user_name: string
  user_avatar: string | null
  post_title: string
}
export async function createEditRequest(data: {
  post_slug: string
  user_id: number
  title: string
  excerpt: string
  content: string
  tags: string[]
  cover_image?: string | null
}): Promise<PostEditRequest> {
  const rows = await sql`
    INSERT INTO post_edit_requests(post_slug, user_id, title, excerpt, content, tags, cover_image)
    VALUES(${data.post_slug}, ${data.user_id}, ${data.title}, ${data.excerpt}, ${data.content}, ${data.tags}, ${data.cover_image ?? null})
    RETURNING *
  `
  return serializeRow(rows[0] as Record<string, unknown>) as unknown as PostEditRequest
}
export async function getEditRequestsByUser(userId: number): Promise<PostEditRequestWithUser[]> {
  const rows = await sql`
    SELECT r.*, u.name as user_name, u.avatar as user_avatar, COALESCE(p.title, r.title) as post_title
    FROM post_edit_requests r
    JOIN users u ON u.id = r.user_id
    LEFT JOIN posts p ON p.slug = r.post_slug AND r.post_slug != '__new__'
    WHERE r.user_id = ${userId}
    ORDER BY r.created_at DESC
  `
  return serializeRows(rows as Record<string, unknown>[]) as unknown as PostEditRequestWithUser[]
}
export async function getAllEditRequests(): Promise<PostEditRequestWithUser[]> {
  const rows = await sql`
    SELECT r.*, u.name as user_name, u.avatar as user_avatar, COALESCE(p.title, r.title) as post_title
    FROM post_edit_requests r
    JOIN users u ON u.id = r.user_id
    LEFT JOIN posts p ON p.slug = r.post_slug AND r.post_slug != '__new__'
    ORDER BY
      CASE r.status WHEN 'pending' THEN 0 ELSE 1 END,
      r.created_at DESC
  `
  return serializeRows(rows as Record<string, unknown>[]) as unknown as PostEditRequestWithUser[]
}
export async function getEditRequestById(id: number): Promise<PostEditRequestWithUser | null> {
  const rows = await sql`
    SELECT r.*, u.name as user_name, u.avatar as user_avatar, COALESCE(p.title, r.title) as post_title
    FROM post_edit_requests r
    JOIN users u ON u.id = r.user_id
    LEFT JOIN posts p ON p.slug = r.post_slug AND r.post_slug != '__new__'
    WHERE r.id = ${id}
    LIMIT 1
  `
  return rows[0] ? serializeRow(rows[0] as Record<string, unknown>) as unknown as PostEditRequestWithUser : null
}
export async function reviewEditRequest(
  id: number,
  status: 'approved' | 'rejected',
  adminNote?: string
): Promise<PostEditRequest> {
  const rows = await sql`
    UPDATE post_edit_requests
    SET status = ${status}, admin_note = ${adminNote ?? null}, reviewed_at = now()
    WHERE id = ${id}
    RETURNING *
  `
  return serializeRow(rows[0] as Record<string, unknown>) as unknown as PostEditRequest
}
export async function getPendingEditRequestsCount(): Promise<number> {
  const rows = await sql`SELECT COUNT(*) as cnt FROM post_edit_requests WHERE status='pending'`
  return Number((rows[0] as { cnt: string }).cnt)
}
export async function deleteEditRequest(id: number, userId: number): Promise<boolean> {
  const rows = await sql`
    DELETE FROM post_edit_requests
    WHERE id = ${id} AND user_id = ${userId}
    RETURNING id
  `
  return rows.length > 0
}
