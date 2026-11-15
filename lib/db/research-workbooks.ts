import { sql, serializeRow } from './_core'
import type { SavedWorkbook } from '@/features/research/lib/workbook'

export async function getResearchWorkbook(userId: number): Promise<SavedWorkbook | null> {
  const rows = await sql`SELECT snapshot, revision, updated_at FROM research_workbooks WHERE user_id = ${userId}`
  return rows[0] ? serializeRow(rows[0]) as unknown as SavedWorkbook : null
}

/** Compare-and-swap prevents stale tabs from overwriting a newer save. */
export async function saveResearchWorkbook(userId: number, snapshot: SavedWorkbook['snapshot'], revision: number): Promise<Omit<SavedWorkbook, 'snapshot'> | null> {
  const json = JSON.stringify(snapshot)
  const rows = revision === 0
    ? await sql`INSERT INTO research_workbooks (user_id, snapshot) VALUES (${userId}, ${json}::jsonb)
        ON CONFLICT (user_id) DO NOTHING RETURNING revision, updated_at`
    : await sql`UPDATE research_workbooks SET snapshot = ${json}::jsonb, revision = revision + 1, updated_at = NOW()
        WHERE user_id = ${userId} AND revision = ${revision} RETURNING revision, updated_at`
  return rows[0] ? serializeRow(rows[0]) as unknown as Omit<SavedWorkbook, 'snapshot'> : null
}
