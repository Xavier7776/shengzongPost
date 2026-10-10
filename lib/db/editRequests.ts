// lib/db/editRequests.ts
// Extracted from lib/db.ts by domain boundary. Logic unchanged.

import { sql, serializeRow, serializeRows } from './_core'
import { sanitizePostContent } from '@/lib/html/sanitize-post'
import { EditionEditConflict } from '@/lib/learn/edit-conflict'

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
  from_id?: number | null
}): Promise<PostEditRequest> {
  const [rows] = await sql.transaction(tx => [tx`WITH target AS (
    SELECT 1 WHERE ${data.post_slug.startsWith('__new__:')} OR EXISTS(SELECT 1 FROM posts WHERE slug=${data.post_slug} AND published=true AND author_id=${data.user_id})
  ), removed AS (
    DELETE FROM post_edit_requests WHERE id=${data.from_id ?? null} AND user_id=${data.user_id} AND status='rejected' AND EXISTS(SELECT 1 FROM target) RETURNING id
  )
    INSERT INTO post_edit_requests(post_slug, user_id, title, excerpt, content, tags, cover_image)
    SELECT ${data.post_slug}, ${data.user_id}, ${data.title}, ${data.excerpt}, ${data.content}, ${data.tags}, ${data.cover_image ?? null}
    WHERE EXISTS(SELECT 1 FROM target) AND (${data.from_id == null} OR EXISTS(SELECT 1 FROM removed))
    RETURNING *
  `])
  if (!rows[0]) throw new Error('Cannot resubmit')
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
): Promise<{ request: PostEditRequest; post: { slug: string; published: boolean } | null }> {
  const current = await getEditRequestById(id)
  if (!current) throw new Error('Request not found')
  if (current.status !== 'pending') throw new Error('Request already reviewed')
  const snapshot = JSON.stringify({ post_slug: current.post_slug, user_id: current.user_id, title: current.title,
    excerpt: current.excerpt, content: current.content, tags: current.tags, cover_image: current.cover_image })
  const content = sanitizePostContent(current.content)
  const protectedValues = JSON.stringify({title:current.title,excerpt:current.excerpt,content,tags:current.tags})
  const isNew = current.post_slug.startsWith('__new__:')
  const desiredSlug = current.post_slug.slice('__new__:'.length) || 'untitled'
  const [, rows] = await sql.transaction(tx => [
    tx`SELECT id FROM post_edit_requests WHERE id=${id} FOR UPDATE`,
    tx`WITH pending AS (
        SELECT * FROM post_edit_requests r WHERE id=${id} AND status='pending'
          AND jsonb_build_object('post_slug',r.post_slug,'user_id',r.user_id,'title',r.title,'excerpt',r.excerpt,
            'content',r.content,'tags',r.tags,'cover_image',r.cover_image)=${snapshot}::jsonb
      ), created AS (
        INSERT INTO posts(slug,title,excerpt,content,tags,published,cover_image,attachments,author_id)
        SELECT ${desiredSlug},title,COALESCE(excerpt,''),${content},tags,false,cover_image,'[]'::jsonb,user_id
        FROM pending WHERE ${status}='approved' AND ${isNew} RETURNING slug,published
      ), edited AS (
        UPDATE posts SET title=pending.title,excerpt=pending.excerpt,content=${content},tags=pending.tags,
          cover_image=COALESCE(pending.cover_image,posts.cover_image),updated_at=NOW()
        FROM pending WHERE posts.slug=pending.post_slug AND posts.author_id=pending.user_id AND posts.published=true
          AND ${status}='approved' AND NOT ${isNew}
          AND NOT EXISTS (
            SELECT 1 FROM learn_editions l,jsonb_each(${protectedValues}::jsonb) requested
            WHERE l.post_id=posts.id AND jsonb_build_object('title',posts.title,'excerpt',posts.excerpt,'content',posts.content,'tags',posts.tags)->requested.key IS DISTINCT FROM requested.value
          ) RETURNING posts.slug,posts.published
      ), reviewed AS (
        UPDATE post_edit_requests SET status=${status},admin_note=${adminNote ?? null},reviewed_at=NOW()
        WHERE id IN (SELECT id FROM pending) AND (${status}='rejected' OR EXISTS(SELECT 1 FROM created) OR EXISTS(SELECT 1 FROM edited)) RETURNING *
      ) SELECT (SELECT to_jsonb(r) FROM reviewed r) AS request,
        (SELECT to_jsonb(p) FROM (SELECT * FROM created UNION ALL SELECT * FROM edited) p) AS post,
        EXISTS(SELECT 1 FROM post_edit_requests WHERE id=${id}) AS request_exists,
        EXISTS(SELECT 1 FROM posts WHERE slug=${current.post_slug}) AS post_exists,
        EXISTS(SELECT 1 FROM posts WHERE slug=${current.post_slug} AND author_id=${current.user_id} AND published=true) AS target_available,
        EXISTS(SELECT 1 FROM learn_editions l JOIN posts p ON p.id=l.post_id WHERE p.slug=${current.post_slug}) AS edition_exists`,
  ])
  const row = rows[0]
  if (!row.request) {
    if (!row.request_exists) throw new Error('Request not found')
    // A competing reviewer or content replacement must never reuse the old sanitized snapshot.
    const latest = await getEditRequestById(id)
    if (!latest || latest.status !== 'pending' || JSON.stringify({post_slug:latest.post_slug,user_id:latest.user_id,title:latest.title,
      excerpt:latest.excerpt,content:latest.content,tags:latest.tags,cover_image:latest.cover_image}) !== snapshot) throw new Error('Request already reviewed')
    if (!row.post_exists && !isNew) throw new Error('Post not found')
    if (!isNew && !row.target_available) throw new Error('Request target unavailable')
    if (row.edition_exists) throw new EditionEditConflict()
    throw new Error('Request already reviewed')
  }
  return { request: serializeRow(row.request as Record<string, unknown>) as unknown as PostEditRequest,
    post: row.post as { slug: string; published: boolean } | null }
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
