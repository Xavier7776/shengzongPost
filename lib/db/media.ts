// lib/db/media.ts
// Extracted from lib/db.ts by domain boundary. Logic unchanged.

import { sql, serializeRow, serializeRows } from './_core'

// ─── Post Images ──────────────────────────────────────────────────────────────
export interface PostImage {
  id: number
  post_slug: string | null
  url: string
  public_id: string
  filename: string
  size: number
  mime_type: string
  uploaded_by: number
  created_at: string
}
export async function createPostImage(data: {
  post_slug: string | null
  url: string
  public_id: string
  filename: string
  size: number
  mime_type: string
  uploaded_by: number
}): Promise<PostImage> {
  const rows = await sql`
    INSERT INTO post_images(post_slug, url, public_id, filename, size, mime_type, uploaded_by)
    VALUES(${data.post_slug}, ${data.url}, ${data.public_id}, ${data.filename}, ${data.size}, ${data.mime_type}, ${data.uploaded_by})
    RETURNING *
  `
  return serializeRow(rows[0] as Record<string, unknown>) as unknown as PostImage
}
export async function getPostImages(postSlug?: string): Promise<PostImage[]> {
  const rows = postSlug
    ? await sql`SELECT * FROM post_images WHERE post_slug=${postSlug} ORDER BY created_at DESC`
    : await sql`SELECT * FROM post_images ORDER BY created_at DESC`
  return serializeRows(rows as Record<string, unknown>[]) as unknown as PostImage[]
}
export async function deletePostImage(id: number): Promise<{ public_id: string } | null> {
  const rows = await sql`DELETE FROM post_images WHERE id=${id} RETURNING public_id`
  return rows[0] ? { public_id: rows[0].public_id as string } : null
}

// ─── Hero Slides ──────────────────────────────────────────────────────────────
export interface HeroSlide {
  id: number
  img: string
  title: string
  subtitle: string
  sort_order: number | null
  enabled: boolean
  created_at: string
}
export async function getAllHeroSlides(): Promise<HeroSlide[]> {
  const rows = await sql`
    SELECT * FROM hero_slides
    ORDER BY sort_order ASC NULLS LAST, created_at ASC
  `
  return serializeRows(rows as Record<string, unknown>[]) as unknown as HeroSlide[]
}
export async function getEnabledHeroSlides(): Promise<HeroSlide[]> {
  const rows = await sql`
    SELECT * FROM hero_slides
    WHERE enabled = true
    ORDER BY sort_order ASC NULLS LAST, created_at ASC
  `
  return serializeRows(rows as Record<string, unknown>[]) as unknown as HeroSlide[]
}
export async function createHeroSlide(data: {
  img: string
  title: string
  subtitle: string
  sort_order?: number
}): Promise<HeroSlide> {
  const rows = await sql`
    INSERT INTO hero_slides(img, title, subtitle, sort_order)
    VALUES(${data.img}, ${data.title}, ${data.subtitle}, ${data.sort_order ?? null})
    RETURNING *
  `
  return serializeRow(rows[0] as Record<string, unknown>) as unknown as HeroSlide
}
export async function updateHeroSlide(
  id: number,
  data: Partial<{ img: string; title: string; subtitle: string; sort_order: number; enabled: boolean }>
): Promise<HeroSlide> {
  const rows = await sql`
    UPDATE hero_slides SET
      img        = COALESCE(${data.img        ?? null}, img),
      title      = COALESCE(${data.title      ?? null}, title),
      subtitle   = COALESCE(${data.subtitle   ?? null}, subtitle),
      sort_order = COALESCE(${data.sort_order ?? null}, sort_order),
      enabled    = COALESCE(${data.enabled    ?? null}, enabled)
    WHERE id = ${id}
    RETURNING *
  `
  return serializeRow(rows[0] as Record<string, unknown>) as unknown as HeroSlide
}
export async function deleteHeroSlide(id: number): Promise<void> {
  await sql`DELETE FROM hero_slides WHERE id = ${id}`
}
