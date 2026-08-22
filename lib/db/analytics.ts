// lib/db/analytics.ts
// Extracted from lib/db.ts by domain boundary. Logic unchanged.

import { sql, serializeRow, serializeRows } from './_core'

// ─── Visitor Tracking (访客追踪) ─────────────────────────────────────────────

export interface VisitorTrackingInput {
  visitor_id: string
  session_id: string
  path: string
  referrer?: string | null
  user_agent?: string | null
  ip_hash?: string | null
  country?: string | null
  is_logged_in: boolean
}

/** 写入一条访客访问记录 */
export async function trackVisitor(data: VisitorTrackingInput): Promise<void> {
  await sql`
    INSERT INTO visitor_tracking(visitor_id, session_id, path, referrer, user_agent, ip_hash, country, is_logged_in)
    VALUES(${data.visitor_id}, ${data.session_id}, ${data.path}, ${data.referrer ?? null}, ${data.user_agent ?? null}, ${data.ip_hash ?? null}, ${data.country ?? null}, ${data.is_logged_in})
  `
}

export type VisitorRange = '7d' | '30d' | '90d' | 'all'

export interface VisitorStats {
  total_visits: number
  unique_visitors: number
  page_views: number
  today_visits: number
  avg_pages_per_visitor: number
}

export interface DailyTrendItem {
  date: string
  visits: number
  unique_visitors: number
}

export interface TopPageItem {
  path: string
  visits: number
}

export interface TopReferrerItem {
  referrer: string
  visits: number
}

// 根据 range 返回起始日期 ISO 字符串（null 表示全部）
function getRangeStartIso(range: VisitorRange): string | null {
  if (range === 'all') return null
  const days = parseInt(range, 10)
  const start = new Date()
  start.setDate(start.getDate() - days)
  return start.toISOString()
}

/** 获取访客聚合统计：总访问量、独立访客数、今日访问、平均浏览页数 */
export async function getVisitorStats(range: VisitorRange): Promise<VisitorStats> {
  const start = getRangeStartIso(range)
  const rows = start
    ? await sql`
        SELECT
          COUNT(*)::int as total_visits,
          COUNT(DISTINCT visitor_id)::int as unique_visitors,
          COUNT(*) FILTER (WHERE created_at::date = NOW()::date)::int as today_visits
        FROM visitor_tracking
        WHERE created_at >= ${start}::timestamptz
      `
    : await sql`
        SELECT
          COUNT(*)::int as total_visits,
          COUNT(DISTINCT visitor_id)::int as unique_visitors,
          COUNT(*) FILTER (WHERE created_at::date = NOW()::date)::int as today_visits
        FROM visitor_tracking
      `
  const r = rows[0] as { total_visits: number; unique_visitors: number; today_visits: number }
  const unique_visitors = r.unique_visitors || 0
  const total_visits = r.total_visits || 0
  const avg_pages_per_visitor = unique_visitors > 0 ? Number((total_visits / unique_visitors).toFixed(2)) : 0
  return {
    total_visits,
    unique_visitors,
    page_views: total_visits, // 页面浏览量 = 总访问量（每次访问记一次浏览）
    today_visits: r.today_visits || 0,
    avg_pages_per_visitor,
  }
}

/** 获取每日访问趋势（访问量 + 独立访客双线） */
export async function getVisitorDailyTrend(range: VisitorRange): Promise<DailyTrendItem[]> {
  const start = getRangeStartIso(range)
  const rows = start
    ? await sql`
        SELECT
          created_at::date as date,
          COUNT(*)::int as visits,
          COUNT(DISTINCT visitor_id)::int as unique_visitors
        FROM visitor_tracking
        WHERE created_at >= ${start}::timestamptz
        GROUP BY created_at::date
        ORDER BY date ASC
      `
    : await sql`
        SELECT
          created_at::date as date,
          COUNT(*)::int as visits,
          COUNT(DISTINCT visitor_id)::int as unique_visitors
        FROM visitor_tracking
        GROUP BY created_at::date
        ORDER BY date ASC
      `
  return rows.map(r => {
    const d = r.date as Date | string
    const dateStr = d instanceof Date ? d.toISOString().split('T')[0] : String(d).split('T')[0]
    return {
      date: dateStr,
      visits: r.visits as number,
      unique_visitors: r.unique_visitors as number,
    }
  })
}

/** 获取热门页面 Top N */
export async function getTopPages(range: VisitorRange, limit = 10): Promise<TopPageItem[]> {
  const start = getRangeStartIso(range)
  const rows = start
    ? await sql`
        SELECT path, COUNT(*)::int as visits
        FROM visitor_tracking
        WHERE created_at >= ${start}::timestamptz
        GROUP BY path
        ORDER BY visits DESC
        LIMIT ${limit}
      `
    : await sql`
        SELECT path, COUNT(*)::int as visits
        FROM visitor_tracking
        GROUP BY path
        ORDER BY visits DESC
        LIMIT ${limit}
      `
  return rows.map(r => ({ path: r.path as string, visits: r.visits as number }))
}

/** 获取来源分析 Top N（空来源归为"直接访问"） */
export async function getTopReferrers(range: VisitorRange, limit = 10): Promise<TopReferrerItem[]> {
  const start = getRangeStartIso(range)
  const rows = start
    ? await sql`
        SELECT COALESCE(NULLIF(referrer, ''), '(直接访问)') as referrer, COUNT(*)::int as visits
        FROM visitor_tracking
        WHERE created_at >= ${start}::timestamptz
        GROUP BY referrer
        ORDER BY visits DESC
        LIMIT ${limit}
      `
    : await sql`
        SELECT COALESCE(NULLIF(referrer, ''), '(直接访问)') as referrer, COUNT(*)::int as visits
        FROM visitor_tracking
        GROUP BY referrer
        ORDER BY visits DESC
        LIMIT ${limit}
      `
  return rows.map(r => ({ referrer: r.referrer as string, visits: r.visits as number }))
}
