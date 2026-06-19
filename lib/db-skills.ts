// lib/db-skills.ts
import { neon } from '@neondatabase/serverless'

if (!process.env.DATABASE_URL) throw new Error('Missing DATABASE_URL')
// 与 lib/db.ts 保持一致：确保每次查询走真实数据库
export const sql = neon(process.env.DATABASE_URL, { fetchOptions: { cache: 'no-store' as RequestCache } })

// ─── serializer ───────────────────────────────────────────────────────────────
function serializeRow(row: Record<string, unknown>): Record<string, unknown> {
  const r: Record<string, unknown> = {}
  for (const k of Object.keys(row))
    r[k] = row[k] instanceof Date ? (row[k] as Date).toISOString() : row[k]
  return r
}
function serializeRows(rows: Record<string, unknown>[]) { return rows.map(serializeRow) }

// ─── Types ────────────────────────────────────────────────────────────────────
export interface Skill {
  id: number
  name: string
  slug: string
  description: string | null
  chinese_summary: string | null
  content: string | null
  source_url: string
  source_type: string
  stars: number
  tags: string[]
  category: string
  cover_image: string | null
  created_at: string
  updated_at: string
}

export type SkillMeta = Omit<Skill, 'content'>

export interface SkillsQueryParams {
  page?: number
  pageSize?: number
  category?: string
  source_type?: string
  sort?: 'stars' | 'updated_at' | 'created_at'
  order?: 'asc' | 'desc'
  search?: string
}

// ─── Queries ──────────────────────────────────────────────────────────────────

export async function getSkills(params: SkillsQueryParams = {}): Promise<{ skills: SkillMeta[]; total: number }> {
  const {
    page = 1,
    pageSize = 12,
    category,
    source_type,
    sort = 'updated_at',
    order = 'desc',
    search,
  } = params

  const offset = (page - 1) * pageSize

  // Build WHERE conditions with parameterized placeholders
  const conditions: string[] = []
  const values: unknown[] = []
  let paramIdx = 1

  if (category && category !== 'all') {
    conditions.push(`category = $${paramIdx++}`)
    values.push(category)
  }
  if (source_type && source_type !== 'all') {
    conditions.push(`source_type = $${paramIdx++}`)
    values.push(source_type)
  }
  if (search) {
    conditions.push(`(name ILIKE $${paramIdx} OR description ILIKE $${paramIdx} OR $${paramIdx} = ANY(tags))`)
    values.push(`%${search}%`)
    paramIdx++
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

  // Validate sort column
  const validSorts = ['stars', 'updated_at', 'created_at']
  const sortCol = validSorts.includes(sort) ? sort : 'updated_at'
  const sortOrder = order === 'asc' ? 'ASC' : 'DESC'

  // Count total
  const countRows = await sql.query(`SELECT COUNT(*)::int as total FROM skills ${where}`, values)
  const total = (countRows[0] as Record<string, unknown>).total as number

  // Fetch page
  const limitIdx = paramIdx++
  const offsetIdx = paramIdx++
  const rows = await sql.query(
    `SELECT id, name, slug, description, chinese_summary, source_url, source_type, stars, tags, category, cover_image, created_at, updated_at
     FROM skills ${where}
     ORDER BY ${sortCol} ${sortOrder}
     LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
    [...values, pageSize, offset]
  )

  return { skills: serializeRows(rows as Record<string, unknown>[]) as unknown as SkillMeta[], total }
}

export async function getSkillBySlug(slug: string): Promise<Skill | null> {
  const rows = await sql`
    SELECT * FROM skills WHERE slug = ${slug} LIMIT 1
  `
  if (!rows[0]) return null
  return serializeRow(rows[0] as Record<string, unknown>) as unknown as Skill
}

export async function getSkillCategories(): Promise<{ category: string; count: number }[]> {
  const rows = await sql`
    SELECT category, COUNT(*)::int as count FROM skills GROUP BY category ORDER BY count DESC
  `
  return rows as unknown as { category: string; count: number }[]
}

export async function upsertSkill(data: {
  name: string
  slug: string
  description?: string
  content?: string
  source_url: string
  source_type: string
  stars?: number
  tags?: string[]
  category?: string
  cover_image?: string
}): Promise<Skill> {
  const rows = await sql`
    INSERT INTO skills (name, slug, description, content, source_url, source_type, stars, tags, category, cover_image)
    VALUES (
      ${data.name},
      ${data.slug},
      ${data.description ?? null},
      ${data.content ?? null},
      ${data.source_url},
      ${data.source_type},
      ${data.stars ?? 0},
      ${data.tags ?? []},
      ${data.category ?? 'other'},
      ${data.cover_image ?? null}
    )
    ON CONFLICT (source_url) DO UPDATE SET
      name = EXCLUDED.name,
      slug = EXCLUDED.slug,
      description = COALESCE(EXCLUDED.description, skills.description),
      content = COALESCE(EXCLUDED.content, skills.content),
      source_type = EXCLUDED.source_type,
      stars = EXCLUDED.stars,
      tags = EXCLUDED.tags,
      category = EXCLUDED.category,
      cover_image = COALESCE(EXCLUDED.cover_image, skills.cover_image),
      updated_at = NOW()
    RETURNING *
  `
  return serializeRow(rows[0] as Record<string, unknown>) as unknown as Skill
}
