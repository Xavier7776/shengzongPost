// lib/db.ts
import { neon } from '@neondatabase/serverless'

if (!process.env.DATABASE_URL) {
  throw new Error('Missing DATABASE_URL environment variable')
}

export const sql = neon(process.env.DATABASE_URL)

// ─── 类型定义 ────────────────────────────────────────────────────────────────

export interface Post {
  id: number
  slug: string
  title: string
  excerpt: string
  content: string
  tags: string[]
  published: boolean
  created_at: string
  updated_at: string
}

export type PostMeta = Omit<Post, 'content'>

// ─── 日期序列化工具 ───────────────────────────────────────────────────────────

function serializeRow(row: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  for (const key of Object.keys(row)) {
    result[key] = row[key] instanceof Date
      ? (row[key] as Date).toISOString()
      : row[key]
  }
  return result
}

function serializeRows(rows: Record<string, unknown>[]): Record<string, unknown>[] {
  return rows.map(serializeRow)
}

// ─── Posts ───────────────────────────────────────────────────────────────────

export async function getAllPosts(): Promise<PostMeta[]> {
  const rows = await sql`
    SELECT id, slug, title, excerpt, tags, published, created_at, updated_at
    FROM posts
    WHERE published = true
    ORDER BY created_at DESC
  `
  return serializeRows(rows as Record<string, unknown>[]) as unknown as PostMeta[]
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  const rows = await sql`
    SELECT * FROM posts WHERE slug = ${slug} AND published = true LIMIT 1
  `
  if (!rows[0]) return null
  return serializeRow(rows[0] as Record<string, unknown>) as unknown as Post
}

export async function getAllPostsAdmin(): Promise<PostMeta[]> {
  const rows = await sql`
    SELECT id, slug, title, excerpt, tags, published, created_at, updated_at
    FROM posts
    ORDER BY created_at DESC
  `
  return serializeRows(rows as Record<string, unknown>[]) as unknown as PostMeta[]
}

export async function getPostBySlugAdmin(slug: string): Promise<Post | null> {
  const rows = await sql`
    SELECT * FROM posts WHERE slug = ${slug} LIMIT 1
  `
  if (!rows[0]) return null
  return serializeRow(rows[0] as Record<string, unknown>) as unknown as Post
}

export async function createPost(data: {
  slug: string
  title: string
  excerpt: string
  content: string
  tags: string[]
  published: boolean
}): Promise<Post> {
  const rows = await sql`
    INSERT INTO posts (slug, title, excerpt, content, tags, published)
    VALUES (${data.slug}, ${data.title}, ${data.excerpt}, ${data.content}, ${data.tags}, ${data.published})
    RETURNING *
  `
  return serializeRow(rows[0] as Record<string, unknown>) as unknown as Post
}

export async function updatePost(
  slug: string,
  data: Partial<{
    title: string
    excerpt: string
    content: string
    tags: string[]
    published: boolean
    slug: string
  }>
): Promise<Post> {
  const rows = await sql`
    UPDATE posts SET
      title      = COALESCE(${data.title ?? null}, title),
      excerpt    = COALESCE(${data.excerpt ?? null}, excerpt),
      content    = COALESCE(${data.content ?? null}, content),
      tags       = COALESCE(${data.tags ?? null}, tags),
      published  = COALESCE(${data.published ?? null}, published),
      slug       = COALESCE(${data.slug ?? null}, slug),
      updated_at = NOW()
    WHERE slug = ${slug}
    RETURNING *
  `
  return serializeRow(rows[0] as Record<string, unknown>) as unknown as Post
}

export async function deletePost(slug: string): Promise<void> {
  await sql`DELETE FROM posts WHERE slug = ${slug}`
}

// ─── Gallery ─────────────────────────────────────────────────────────────────

export interface GalleryImage {
  id: number
  url: string
  public_id: string
  title: string
  category: string
  sort_order: number
  created_at: string
}

export async function getAllGalleryImages(): Promise<GalleryImage[]> {
  const rows = await sql`
    SELECT * FROM gallery_images ORDER BY sort_order ASC, created_at DESC
  `
  return serializeRows(rows as Record<string, unknown>[]) as unknown as GalleryImage[]
}

export async function createGalleryImage(data: {
  url: string
  public_id: string
  title: string
  category: string
}): Promise<GalleryImage> {
  const rows = await sql`
    INSERT INTO gallery_images (url, public_id, title, category)
    VALUES (${data.url}, ${data.public_id}, ${data.title}, ${data.category})
    RETURNING *
  `
  return serializeRow(rows[0] as Record<string, unknown>) as unknown as GalleryImage
}

export async function updateGalleryImage(
  id: number,
  data: Partial<{ title: string; category: string; sort_order: number }>
): Promise<GalleryImage> {
  const rows = await sql`
    UPDATE gallery_images SET
      title      = COALESCE(${data.title ?? null}, title),
      category   = COALESCE(${data.category ?? null}, category),
      sort_order = COALESCE(${data.sort_order ?? null}, sort_order)
    WHERE id = ${id}
    RETURNING *
  `
  return serializeRow(rows[0] as Record<string, unknown>) as unknown as GalleryImage
}

export async function deleteGalleryImage(id: number): Promise<string> {
  const rows = await sql`
    DELETE FROM gallery_images WHERE id = ${id} RETURNING public_id
  `
  return (rows[0] as { public_id: string }).public_id
}

// ─── Users ───────────────────────────────────────────────────────────────────

export interface User {
  id: number
  email: string
  name: string
  password: string
  phone: string | null
  bio: string | null
  avatar: string | null
  verified: boolean
  verify_token: string | null
  token_expires: string | null
  created_at: string
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const rows = await sql`
    SELECT * FROM users WHERE email = ${email} LIMIT 1
  `
  if (!rows[0]) return null
  return serializeRow(rows[0] as Record<string, unknown>) as unknown as User
}

export async function getUserById(id: number): Promise<User | null> {
  const rows = await sql`
    SELECT * FROM users WHERE id = ${id} LIMIT 1
  `
  if (!rows[0]) return null
  return serializeRow(rows[0] as Record<string, unknown>) as unknown as User
}

export async function createUser(data: {
  email: string
  name: string
  password: string
}): Promise<User> {
  const rows = await sql`
    INSERT INTO users (email, name, password)
    VALUES (${data.email}, ${data.name}, ${data.password})
    RETURNING *
  `
  return serializeRow(rows[0] as Record<string, unknown>) as unknown as User
}

export async function updateUserProfile(
  id: number,
  data: { name: string; phone?: string | null; bio?: string | null; avatar?: string | null }
): Promise<void> {
  await sql`
    UPDATE users SET
      name   = ${data.name},
      phone  = ${data.phone ?? null},
      bio    = ${data.bio ?? null},
      avatar = ${data.avatar ?? null}
    WHERE id = ${id}
  `
}

// ─── Comments ────────────────────────────────────────────────────────────────

export interface Comment {
  id: number
  post_slug: string
  user_id: number
  user_name: string
  content: string
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
}

export async function getApprovedComments(postSlug: string): Promise<Comment[]> {
  const rows = await sql`
    SELECT * FROM comments
    WHERE post_slug = ${postSlug} AND status = 'approved'
    ORDER BY created_at ASC
  `
  return serializeRows(rows as Record<string, unknown>[]) as unknown as Comment[]
}

export async function getAllCommentsAdmin(): Promise<Comment[]> {
  const rows = await sql`
    SELECT * FROM comments ORDER BY created_at DESC
  `
  return serializeRows(rows as Record<string, unknown>[]) as unknown as Comment[]
}

export async function getPendingCommentsCount(): Promise<number> {
  const rows = await sql`
    SELECT COUNT(*) as count FROM comments WHERE status = 'pending'
  `
  return Number((rows[0] as { count: string }).count)
}

export async function createComment(data: {
  post_slug: string
  user_id: number
  user_name: string
  content: string
}): Promise<Comment> {
  const rows = await sql`
    INSERT INTO comments (post_slug, user_id, user_name, content)
    VALUES (${data.post_slug}, ${data.user_id}, ${data.user_name}, ${data.content})
    RETURNING *
  `
  return serializeRow(rows[0] as Record<string, unknown>) as unknown as Comment
}

export async function updateCommentStatus(
  id: number,
  status: 'approved' | 'rejected'
): Promise<Comment> {
  const rows = await sql`
    UPDATE comments SET status = ${status} WHERE id = ${id} RETURNING *
  `
  return serializeRow(rows[0] as Record<string, unknown>) as unknown as Comment
}

// ─── Auth tokens ─────────────────────────────────────────────────────────────

export async function setVerifyToken(
  userId: number,
  token: string,
  expires: Date
): Promise<void> {
  await sql`
    UPDATE users
    SET verify_token = ${token}, token_expires = ${expires.toISOString()}
    WHERE id = ${userId}
  `
}

export async function getUserByVerifyToken(token: string): Promise<User | null> {
  const rows = await sql`
    SELECT * FROM users
    WHERE verify_token = ${token}
      AND token_expires > NOW()
    LIMIT 1
  `
  if (!rows[0]) return null
  return serializeRow(rows[0] as Record<string, unknown>) as unknown as User
}

export async function markUserVerified(userId: number): Promise<void> {
  await sql`
    UPDATE users
    SET verified = true, verify_token = NULL, token_expires = NULL
    WHERE id = ${userId}
  `
}
