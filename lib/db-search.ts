// lib/db-search.ts
// 全站搜索：跨 posts / skills / gallery 三张表查询（分三次查询，代码中合并，避免 UNION 类型问题）
import { sql } from './db'

export interface SearchResult {
  type: 'post' | 'skill' | 'gallery'
  id: string
  title: string
  excerpt: string
  url: string
  image: string | null
  tags: string[]
  meta: string
  created_at: string
}

export async function searchAll(q: string, limit = 20): Promise<SearchResult[]> {
  if (!q || q.trim().length === 0) return []
  const term = `%${q}%`

  // 并行查询三张表
  const [postRows, skillRows, galleryRows] = await Promise.all([
    // 博客文章
    sql`
      SELECT
        p.slug AS id,
        p.title AS title,
        COALESCE(p.excerpt, '') AS excerpt,
        '/blog/' || p.slug AS url,
        p.cover_image AS image,
        COALESCE(u.name, 'ARC') AS meta,
        p.created_at::text AS created_at
      FROM posts p LEFT JOIN users u ON u.id = p.author_id
      WHERE p.published = true
        AND (p.title ILIKE ${term} OR p.excerpt ILIKE ${term} OR p.content ILIKE ${term})
      ORDER BY p.created_at DESC
      LIMIT ${limit}
    `,
    // Skills
    sql`
      SELECT
        s.slug AS id,
        s.name AS title,
        COALESCE(s.chinese_summary, s.description, '') AS excerpt,
        '/skills/' || s.slug AS url,
        s.cover_image AS image,
        COALESCE(s.tags, ARRAY[]::text[]) AS tags,
        s.category AS meta,
        s.created_at::text AS created_at
      FROM skills s
      WHERE s.name ILIKE ${term}
        OR s.description ILIKE ${term}
        OR s.chinese_summary ILIKE ${term}
      ORDER BY s.stars DESC NULLS LAST
      LIMIT ${limit}
    `,
    // 画廊
    sql`
      SELECT
        g.id::text AS id,
        COALESCE(g.title, '未命名作品') AS title,
        COALESCE(g.category, '') AS excerpt,
        '/gallery' AS url,
        g.url AS image,
        COALESCE(g.category, '') AS meta,
        g.created_at::text AS created_at
      FROM gallery_images g
      WHERE g.title ILIKE ${term} OR g.category ILIKE ${term}
      ORDER BY g.created_at DESC
      LIMIT ${limit}
    `,
  ])

  // 合并结果，按类型排序（post → skill → gallery），同类型按时间倒序
  const results: SearchResult[] = [
    ...postRows.map((r: Record<string, unknown>) => ({
      type: 'post' as const,
      id: r.id as string,
      title: r.title as string,
      excerpt: r.excerpt as string,
      url: r.url as string,
      image: (r.image as string) ?? null,
      tags: [],
      meta: r.meta as string,
      created_at: r.created_at as string,
    })),
    ...skillRows.map((r: Record<string, unknown>) => ({
      type: 'skill' as const,
      id: r.id as string,
      title: r.title as string,
      excerpt: r.excerpt as string,
      url: r.url as string,
      image: (r.image as string) ?? null,
      tags: (r.tags as string[]) ?? [],
      meta: r.meta as string,
      created_at: r.created_at as string,
    })),
    ...galleryRows.map((r: Record<string, unknown>) => ({
      type: 'gallery' as const,
      id: r.id as string,
      title: r.title as string,
      excerpt: r.excerpt as string,
      url: r.url as string,
      image: (r.image as string) ?? null,
      tags: [],
      meta: r.meta as string,
      created_at: r.created_at as string,
    })),
  ]

  return results
}
