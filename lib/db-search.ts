import { sql } from './db/_core'
import type { SearchQuery, SearchResponse } from './search'
export type { SearchResult } from './search'

export async function searchAll(query: SearchQuery): Promise<SearchResponse> {
  const { q, type, sort, page, pageSize } = query
  if (!q) return { ...query, results: [], total: 0, totalPages: 0, counts: { all: 0, post: 0, skill: 0, gallery: 0 } }
  const literal = q.replace(/[\\%_]/g, '\\$&')
  // One statement keeps facets and the selected page on the same database snapshot.
  const rows = await sql`
    WITH params AS (
      SELECT ${q}::text AS q, ${`%${literal}%`}::text AS term, ${`${literal}%`}::text AS prefix
    ), candidates AS (
      SELECT 'post'::text AS type, p.slug::text AS id, p.title AS title,
        COALESCE(p.excerpt, '') AS excerpt, '/blog/' || p.slug AS url,
        p.cover_image AS image, COALESCE(p.tags, ARRAY[]::text[]) AS tags,
        COALESCE(u.name, 'ARC') AS meta, p.created_at,
        COALESCE(p.content, '') AS body, ''::text AS extra
      FROM posts p LEFT JOIN users u ON u.id = p.author_id WHERE p.published = TRUE
      UNION ALL
      SELECT 'skill', s.slug::text, s.name, COALESCE(s.chinese_summary, s.description, ''),
        '/skills/' || s.slug, s.cover_image, COALESCE(s.tags, ARRAY[]::text[]),
        COALESCE(s.category, ''), s.created_at, COALESCE(s.content, ''), COALESCE(s.description, '')
      FROM skills s
      UNION ALL
      SELECT 'gallery', g.id::text, COALESCE(g.title, '未命名作品'), COALESCE(g.description, g.category, ''),
        '/gallery', g.url, COALESCE(g.tags, ARRAY[]::text[]), COALESCE(g.category, ''),
        g.created_at, ''::text, COALESCE(g.category, '')
      FROM gallery_images g
    ), matched AS MATERIALIZED (
      SELECT c.type, c.id, c.title, LEFT(c.excerpt, 1000) AS excerpt, c.url, c.image, c.tags, c.meta, c.created_at,
        GREATEST(
          CASE WHEN LOWER(c.title) = LOWER(p.q) THEN 100
            WHEN c.title ILIKE p.prefix THEN 80 WHEN c.title ILIKE p.term THEN 60 ELSE 0 END,
          CASE WHEN EXISTS (SELECT 1 FROM unnest(c.tags) t WHERE LOWER(t) = LOWER(p.q)) THEN 50 ELSE 0 END,
          CASE WHEN c.excerpt ILIKE p.term OR c.extra ILIKE p.term THEN 25 ELSE 0 END,
          CASE WHEN c.body ILIKE p.term THEN 10 ELSE 0 END,
          CASE WHEN EXISTS (SELECT 1 FROM unnest(c.tags) t WHERE t ILIKE p.term) THEN 10 ELSE 0 END
        ) AS score
      FROM candidates c CROSS JOIN params p
      WHERE c.title ILIKE p.term OR c.excerpt ILIKE p.term OR c.extra ILIKE p.term OR c.body ILIKE p.term
        OR EXISTS (SELECT 1 FROM unnest(c.tags) t WHERE t ILIKE p.term)
    ), selected AS (
      SELECT *, ROW_NUMBER() OVER (ORDER BY
        CASE WHEN ${sort}::text = 'relevance' THEN score ELSE 0 END DESC,
        created_at DESC NULLS LAST, type ASC, id ASC) AS position
      FROM matched WHERE ${type}::text = 'all' OR type = ${type}
    ), page_rows AS (
      SELECT * FROM selected ORDER BY position LIMIT ${pageSize} OFFSET ${(page - 1) * pageSize}
    )
    SELECT
      (SELECT COALESCE(jsonb_agg(to_jsonb(r) - 'score' - 'position' ORDER BY position), '[]'::jsonb) FROM page_rows r) AS results,
      COUNT(*)::int AS "all",
      COUNT(*) FILTER (WHERE type = 'post')::int AS post,
      COUNT(*) FILTER (WHERE type = 'skill')::int AS skill,
      COUNT(*) FILTER (WHERE type = 'gallery')::int AS gallery
    FROM matched
  `
  const row = rows[0]
  const counts = { all: Number(row.all), post: Number(row.post), skill: Number(row.skill), gallery: Number(row.gallery) }
  const total = counts[type]
  return { ...query, results: row.results as SearchResponse['results'], total, totalPages: Math.ceil(total / pageSize), counts }
}
