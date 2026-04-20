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

// ─── 查询函数 ────────────────────────────────────────────────────────────────

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
