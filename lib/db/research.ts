// lib/db/research.ts
// Extracted from lib/db.ts by domain boundary. Logic unchanged.

import { sql, serializeRow, serializeRows } from './_core'

// ─── Research Reports (深度研究历史) ─────────────────────────────────────────

export interface ResearchReport {
  id: number
  user_id: number
  topic: string
  model: string
  language: string
  status: string
  report_content: string
  elapsed_seconds: number
  created_at: string
}

export interface ResearchReportMeta {
  id: number
  topic: string
  model: string
  language: string
  status: string
  elapsed_seconds: number
  created_at: string
}

/** 获取用户的深度研究历史列表（不含报告正文，避免传输过大） */
export async function getResearchReports(userId: number, limit = 50): Promise<ResearchReportMeta[]> {
  const rows = await sql`
    SELECT id, topic, model, language, status, elapsed_seconds, created_at
    FROM research_reports
    WHERE user_id = ${userId}
    ORDER BY created_at DESC
    LIMIT ${limit}
  `
  return serializeRows(rows as Record<string, unknown>[]) as unknown as ResearchReportMeta[]
}

/** 获取单条研报详情（含正文） */
export async function getResearchReportById(userId: number, reportId: number): Promise<ResearchReport | null> {
  const rows = await sql`
    SELECT * FROM research_reports
    WHERE id = ${reportId} AND user_id = ${userId}
    LIMIT 1
  `
  if (!rows[0]) return null
  return serializeRow(rows[0] as Record<string, unknown>) as unknown as ResearchReport
}

/** 保存一条深度研究结果 */
export async function createResearchReport(data: {
  user_id: number
  topic: string
  model: string
  language: string
  status: string
  report_content: string
  elapsed_seconds: number
}): Promise<ResearchReport> {
  const rows = await sql`
    INSERT INTO research_reports(user_id, topic, model, language, status, report_content, elapsed_seconds)
    VALUES(${data.user_id}, ${data.topic}, ${data.model}, ${data.language}, ${data.status}, ${data.report_content}, ${data.elapsed_seconds})
    RETURNING *
  `
  return serializeRow(rows[0] as Record<string, unknown>) as unknown as ResearchReport
}

/** 删除一条研报 */
export async function deleteResearchReport(userId: number, reportId: number): Promise<void> {
  await sql`DELETE FROM research_reports WHERE id = ${reportId} AND user_id = ${userId}`
}
