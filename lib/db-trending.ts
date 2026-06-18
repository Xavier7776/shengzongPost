// lib/db-trending.ts
import { neon } from '@neondatabase/serverless'

if (!process.env.DATABASE_URL) throw new Error('Missing DATABASE_URL')
const sql = neon(process.env.DATABASE_URL)

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TrendingItem {
  id: number
  repo_name: string
  slug: string
  full_name: string
  description: string | null
  html_url: string
  stars: number
  forks: number
  language: string | null
  owner_avatar: string | null
  topics: string[]
  period: string
  stars_gained: number
  rank: number
  crawled_at: string
  created_at: string
}

// ─── Serializer ───────────────────────────────────────────────────────────────

function serializeRow(row: Record<string, unknown>): Record<string, unknown> {
  const r: Record<string, unknown> = {}
  for (const k of Object.keys(row))
    r[k] = row[k] instanceof Date ? (row[k] as Date).toISOString() : row[k]
  return r
}

function serializeRows(rows: Record<string, unknown>[]) {
  return rows.map(serializeRow)
}

// ─── Queries ──────────────────────────────────────────────────────────────────

/**
 * 获取最新一次爬取的 Trending 数据
 * 用 crawled_date（日期）匹配而非精确 crawled_at 时间戳，
 * 因为 saveToDatabase 每条记录的 crawled_at 可能微秒级不同
 */
export async function getTrending(
  period: 'daily' | 'weekly' | 'growth',
  limit = 30
): Promise<{ trending: TrendingItem[]; crawledAt: string | null }> {
  // 获取最新一次爬取日期
  const latestResult = await sql`
    SELECT MAX(crawled_date) as latest FROM github_trending WHERE period = ${period}
  `
  const latest = (latestResult[0] as any)?.latest
  if (!latest) {
    return { trending: [], crawledAt: null }
  }

  const rows = await sql`
    SELECT * FROM github_trending
    WHERE period = ${period} AND crawled_date = (
      SELECT MAX(crawled_date) FROM github_trending WHERE period = ${period}
    )
    ORDER BY rank ASC
    LIMIT ${limit}
  `

  // crawledAt 用最新一条记录的 crawled_at
  const crawledAt = rows.length > 0
    ? (rows[0] as any).crawled_at
    : null

  return {
    trending: serializeRows(rows as Record<string, unknown>[]) as unknown as TrendingItem[],
    crawledAt: crawledAt instanceof Date ? crawledAt.toISOString() : crawledAt,
  }
}

/**
 * 获取所有可用的爬取时间点
 */
export async function getTrendingDates(): Promise<{ period: string; crawled_at: string }[]> {
  const rows = await sql`
    SELECT DISTINCT period, crawled_date as crawled_at
    FROM github_trending
    ORDER BY crawled_at DESC, period
  `
  return (rows as any[]).map(r => ({
    period: r.period,
    crawled_at: r.crawled_at instanceof Date ? r.crawled_at.toISOString() : r.crawled_at,
  }))
}

/**
 * 获取指定时间点的 Trending 数据
 */
export async function getTrendingByDate(
  period: string,
  date: string,
  limit = 30
): Promise<TrendingItem[]> {
  const rows = await sql`
    SELECT * FROM github_trending
    WHERE period = ${period} AND crawled_date = ${date}
    ORDER BY rank ASC
    LIMIT ${limit}
  `
  return serializeRows(rows as Record<string, unknown>[]) as unknown as TrendingItem[]
}

/**
 * 获取增速排行（按 stars_gained 排序）
 * 用 crawled_date 匹配，原因同 getTrending
 */
export async function getGrowthRanking(limit = 30): Promise<TrendingItem[]> {
  const rows = await sql`
    SELECT * FROM github_trending
    WHERE period = 'growth' AND crawled_date = (
      SELECT MAX(crawled_date) FROM github_trending WHERE period = 'growth'
    )
    ORDER BY stars_gained DESC, stars DESC
    LIMIT ${limit}
  `
  return serializeRows(rows as Record<string, unknown>[]) as unknown as TrendingItem[]
}

/**
 * 获取所有语言列表（用于筛选）
 * 用 crawled_date 匹配，可选按 period 过滤
 */
export async function getTrendingLanguages(
  period?: 'daily' | 'weekly' | 'growth'
): Promise<{ language: string; count: number }[]> {
  const rows = await sql`
    SELECT language, COUNT(*)::int as count
    FROM github_trending
    WHERE crawled_date = (
      SELECT MAX(crawled_date) FROM github_trending
      ${period ? sql`WHERE period = ${period}` : sql``}
    )
    AND language IS NOT NULL
    ${period ? sql`AND period = ${period}` : sql``}
    GROUP BY language
    ORDER BY count DESC
  `
  return rows as unknown as { language: string; count: number }[]
}
