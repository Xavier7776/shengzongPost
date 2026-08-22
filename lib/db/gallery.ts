// lib/db/gallery.ts
// Extracted from lib/db.ts by domain boundary. Logic unchanged.

import { sql, serializeRow, serializeRows } from './_core'

// ─── Gallery ─────────────────────────────────────────────────────────────────
export interface GalleryImage {
  id: number; url: string; public_id: string; title: string; category: string
  description: string | null; tags: string[]; width: number; height: number
  likes: number; is_featured: boolean; sort_order: number; created_at: string
}
export async function getAllGalleryImages(): Promise<GalleryImage[]> {
  const rows = await sql`SELECT * FROM gallery_images ORDER BY is_featured DESC, sort_order ASC, created_at DESC`
  return serializeRows(rows as Record<string, unknown>[]) as unknown as GalleryImage[]
}
export async function createGalleryImage(data: {
  url: string; public_id: string; title: string; category: string
  description?: string; tags?: string[]; width?: number; height?: number
}): Promise<GalleryImage> {
  const rows = await sql`
    INSERT INTO gallery_images(url,public_id,title,category,description,tags,width,height)
    VALUES(${data.url},${data.public_id},${data.title},${data.category},${data.description ?? ''},${data.tags ?? []},${data.width ?? 0},${data.height ?? 0})
    RETURNING *`
  return serializeRow(rows[0] as Record<string, unknown>) as unknown as GalleryImage
}
export async function updateGalleryImage(
  id: number,
  data: Partial<{ title: string; category: string; sort_order: number; description: string; tags: string[]; is_featured: boolean }>
): Promise<GalleryImage> {
  const rows = await sql`
    UPDATE gallery_images SET
      title       = COALESCE(${data.title ?? null}, title),
      category    = COALESCE(${data.category ?? null}, category),
      sort_order  = COALESCE(${data.sort_order ?? null}, sort_order),
      description = COALESCE(${data.description ?? null}, description),
      tags        = COALESCE(${data.tags ?? null}, tags),
      is_featured = COALESCE(${data.is_featured ?? null}, is_featured)
    WHERE id=${id} RETURNING *`
  return serializeRow(rows[0] as Record<string, unknown>) as unknown as GalleryImage
}
export async function deleteGalleryImage(id: number): Promise<string> {
  const rows = await sql`DELETE FROM gallery_images WHERE id=${id} RETURNING public_id`
  return (rows[0] as { public_id: string }).public_id
}
export async function likeGalleryImage(id: number): Promise<number> {
  const rows = await sql`UPDATE gallery_images SET likes = likes + 1 WHERE id=${id} RETURNING likes`
  return (rows[0] as { likes: number }).likes
}
export async function getGalleryTagStats(): Promise<{ tag: string; count: number }[]> {
  const rows = await sql`
    SELECT t AS tag, COUNT(*)::int AS count
    FROM gallery_images, unnest(tags) AS t
    GROUP BY t ORDER BY count DESC LIMIT 30`
  return rows as unknown as { tag: string; count: number }[]
}
