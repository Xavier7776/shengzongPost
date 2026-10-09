// lib/db/posts.ts
// Extracted from lib/db.ts by domain boundary. Logic unchanged.

import { sql, serializeRow, serializeRows } from './_core'
import type { User } from './users'
import { sanitizePostContent } from '@/lib/html/sanitize-post'

// ─── Posts ────────────────────────────────────────────────────────────────────
export interface Post {
  id: number; slug: string; title: string; excerpt: string; content: string
  tags: string[]; published: boolean; created_at: string; updated_at: string; cover_image: string | null
  author_id?: number | null
  author_name?: string | null
  author_avatar?: string | null
  author_bio?: string | null
}
export type PostMeta = Omit<Post, 'content'>

export async function getAllPosts(): Promise<PostMeta[]> {
  const rows = await sql`
    SELECT p.id,p.slug,p.title,p.excerpt,p.tags,p.published,p.created_at,p.updated_at,p.cover_image,
           p.author_id,u.name as author_name,u.avatar as author_avatar
    FROM posts p LEFT JOIN users u ON u.id = p.author_id
    WHERE p.published=true ORDER BY p.created_at DESC`
  return serializeRows(rows as Record<string, unknown>[]) as unknown as PostMeta[]
}
export async function getPostsPaginated(page: number, pageSize: number): Promise<{ posts: PostMeta[]; total: number }> {
  const offset = (page - 1) * pageSize
  const countRow = await sql`SELECT COUNT(*)::int as total FROM posts WHERE published=true`
  const total = (countRow[0] as Record<string, unknown>).total as number
  const rows = await sql`
    SELECT p.id,p.slug,p.title,p.excerpt,p.tags,p.published,p.created_at,p.updated_at,p.cover_image,
           p.author_id,u.name as author_name,u.avatar as author_avatar
    FROM posts p LEFT JOIN users u ON u.id = p.author_id
    WHERE p.published=true ORDER BY p.created_at DESC
    LIMIT ${pageSize} OFFSET ${offset}`
  return { posts: serializeRows(rows as Record<string, unknown>[]) as unknown as PostMeta[], total }
}
export async function getPostBySlug(slug: string): Promise<Post | null> {
  const rows = await sql`
    SELECT p.*,u.name as author_name,u.avatar as author_avatar,u.bio as author_bio
    FROM posts p LEFT JOIN users u ON u.id = p.author_id
    WHERE p.slug=${slug} AND p.published=true LIMIT 1`
  if (!rows[0]) return null
  const post = serializeRow(rows[0] as Record<string, unknown>) as unknown as Post
  return post
}
export async function getAllPostsAdmin(): Promise<PostMeta[]> {
  const rows = await sql`
    SELECT p.id,p.slug,p.title,p.excerpt,p.tags,p.published,p.created_at,p.updated_at,p.cover_image,p.author_id,
           u.name as author_name, u.avatar as author_avatar
    FROM posts p LEFT JOIN users u ON u.id = p.author_id
    ORDER BY p.created_at DESC`
  return serializeRows(rows as Record<string, unknown>[]) as unknown as PostMeta[]
}
export async function getPostBySlugAdmin(slug: string): Promise<Post | null> {
  const rows = await sql`
    SELECT p.*,u.name as author_name
    FROM posts p LEFT JOIN users u ON u.id = p.author_id
    WHERE p.slug=${slug} LIMIT 1`
  if (!rows[0]) return null
  const post = serializeRow(rows[0] as Record<string, unknown>) as unknown as Post
  return post
}
export async function createPost(data: {
  slug: string
  title: string
  excerpt: string
  content: string
  tags: string[]
  published: boolean
  cover_image?: string | null
  attachments?: { url: string; filename: string; size: number }[]
  author_id?: number | null
}): Promise<Post> {
  const attachments = JSON.stringify(data.attachments ?? [])
  const safeContent = sanitizePostContent(data.content)
  const rows = await sql`
    INSERT INTO posts(slug,title,excerpt,content,tags,published,cover_image,attachments,author_id)
    VALUES(${data.slug},${data.title},${data.excerpt},${safeContent},${data.tags},${data.published},${data.cover_image ?? null},${attachments}::jsonb,${data.author_id ?? null})
    RETURNING *`
  return serializeRow(rows[0] as Record<string, unknown>) as unknown as Post
}
export async function updatePost(slug: string, data: Partial<{ title: string; excerpt: string; content: string; tags: string[]; published: boolean; slug: string; cover_image: string; attachments: { url: string; filename: string; size: number }[]; author_id: number | null }>): Promise<Post> {
  let rows
  if (data.attachments !== undefined) {
    const attachments = JSON.stringify(data.attachments)
    rows = await sql`UPDATE posts SET title=COALESCE(${data.title??null},title),excerpt=COALESCE(${data.excerpt??null},excerpt),content=COALESCE(${data.content !== undefined ? sanitizePostContent(data.content) : null},content),tags=COALESCE(${data.tags??null},tags),published=COALESCE(${data.published??null},published),slug=COALESCE(${data.slug??null},slug),cover_image=COALESCE(${data.cover_image??null},cover_image),attachments=${attachments}::jsonb,author_id=COALESCE(${data.author_id??null},author_id),updated_at=NOW() WHERE slug=${slug} RETURNING *`
  } else {
    rows = await sql`UPDATE posts SET title=COALESCE(${data.title??null},title),excerpt=COALESCE(${data.excerpt??null},excerpt),content=COALESCE(${data.content !== undefined ? sanitizePostContent(data.content) : null},content),tags=COALESCE(${data.tags??null},tags),published=COALESCE(${data.published??null},published),slug=COALESCE(${data.slug??null},slug),cover_image=COALESCE(${data.cover_image??null},cover_image),author_id=COALESCE(${data.author_id??null},author_id),updated_at=NOW() WHERE slug=${slug} RETURNING *`
  }
  return serializeRow(rows[0] as Record<string, unknown>) as unknown as Post
}
export async function deletePost(slug: string): Promise<void> { await sql`DELETE FROM posts WHERE slug=${slug}` }
export async function incrementViewCount(slug: string): Promise<void> {
  await sql`UPDATE posts SET view_count = COALESCE(view_count, 0) + 1 WHERE slug=${slug}`
}
export async function getOrCreateAiBot(): Promise<User> {
  const existing = await sql`SELECT * FROM users WHERE email='ai-bot@system.internal' LIMIT 1`
  if (existing[0]) return serializeRow(existing[0] as Record<string, unknown>) as unknown as User
  const rows = await sql`
    INSERT INTO users(email, name, password, role, verified)
    VALUES('ai-bot@system.internal', 'AI 助手', 'DISABLED', 'ai', true)
    RETURNING *
  `
  return serializeRow(rows[0] as Record<string, unknown>) as unknown as User
}


export async function getAdjacentPosts(slug: string): Promise<{ prev: PostMeta | null; next: PostMeta | null }> {
  const current = await sql`SELECT id FROM posts WHERE slug=${slug} AND published=true LIMIT 1`
  if (!current[0]) return { prev: null, next: null }
  const currentId = current[0].id as number

  // 上一篇：更早的文章（id 更小）
  const prevRows = await sql`
    SELECT p.slug,p.title,p.excerpt,p.tags,p.created_at,p.cover_image,
           p.author_id,u.name as author_name,u.avatar as author_avatar
    FROM posts p LEFT JOIN users u ON u.id=p.author_id
    WHERE p.published=true AND p.id < ${currentId}
    ORDER BY p.id DESC LIMIT 1`

  // 下一篇：更新的文章（id 更大）
  const nextRows = await sql`
    SELECT p.slug,p.title,p.excerpt,p.tags,p.created_at,p.cover_image,
           p.author_id,u.name as author_name,u.avatar as author_avatar
    FROM posts p LEFT JOIN users u ON u.id=p.author_id
    WHERE p.published=true AND p.id > ${currentId}
    ORDER BY p.id ASC LIMIT 1`

  return {
    prev: prevRows[0] ? serializeRow(prevRows[0] as Record<string, unknown>) as unknown as PostMeta : null,
    next: nextRows[0] ? serializeRow(nextRows[0] as Record<string, unknown>) as unknown as PostMeta : null,
  }
}

export async function getPostsByAuthor(authorId: number): Promise<PostMeta[]> {
  const rows = await sql`
    SELECT p.id,p.slug,p.title,p.excerpt,p.tags,p.published,p.created_at,p.updated_at,p.cover_image,
           p.author_id,u.name as author_name,u.avatar as author_avatar
    FROM posts p LEFT JOIN users u ON u.id = p.author_id
    WHERE p.author_id=${authorId} AND p.published=true
    ORDER BY p.created_at DESC`
  return serializeRows(rows as Record<string, unknown>[]) as unknown as PostMeta[]
}


/** Published-only ranking: cumulative views, then newest first, never the page's arbitrary 4–8 items. */
export async function getPopularPosts(limit = 5): Promise<PostMeta[]> {
  const safeLimit = Math.max(1, Math.min(10, Math.floor(limit)))
  const rows = await sql`SELECT p.id,p.slug,p.title,p.excerpt,p.tags,p.published,p.created_at,
      p.updated_at,p.cover_image,p.author_id,u.name AS author_name,u.avatar AS author_avatar
    FROM posts p LEFT JOIN users u ON u.id=p.author_id
    WHERE p.published=TRUE AND COALESCE(p.view_count,0)>0
    ORDER BY COALESCE(p.view_count,0) DESC,p.created_at DESC,p.id DESC
    LIMIT ${safeLimit}`
  return serializeRows(rows as Record<string, unknown>[]) as unknown as PostMeta[]
}

/** Published-only global category counts, no longer limited to the 12 posts on current page. */
export async function getBlogTagCounts(): Promise<{tag:string;count:number}[]> {
  const rows = await sql`SELECT t.tag AS tag, COUNT(DISTINCT p.id)::int AS count
    FROM posts p CROSS JOIN LATERAL unnest(p.tags) AS t(tag)
    WHERE p.published=TRUE AND t.tag<>''
    GROUP BY t.tag ORDER BY count DESC,t.tag ASC LIMIT 200`
  return rows.map(row=>({tag:String(row.tag),count:Number(row.count)}))
}

/** Page through every published post with a selected tag, including older posts. */
export async function getPostsPaginatedByTag(
  page: number, pageSize: number, tag: string,
): Promise<{posts:PostMeta[];total:number}> {
  const offset = (page - 1) * pageSize
  const countRows = await sql`SELECT COUNT(*)::int AS total
    FROM posts WHERE published=TRUE AND ${tag}=ANY(tags)`
  const rows = await sql`SELECT p.id,p.slug,p.title,p.excerpt,p.tags,p.published,p.created_at,
      p.updated_at,p.cover_image,p.author_id,u.name AS author_name,u.avatar AS author_avatar
    FROM posts p LEFT JOIN users u ON u.id=p.author_id
    WHERE p.published=TRUE AND ${tag}=ANY(p.tags)
    ORDER BY p.created_at DESC,p.id DESC LIMIT ${pageSize} OFFSET ${offset}`
  return {
    posts:serializeRows(rows as Record<string,unknown>[]) as unknown as PostMeta[],
    total:Number(countRows[0]?.total ?? 0),
  }
}
