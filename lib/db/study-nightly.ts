import { sql } from './_core'
import { parseNightlyAnalysis, type NightlyAnalysis, type ReviewRecord } from '@/lib/ai/study-nightly'

export type NightlyReview = { date: string; recordCount: number; minutes: number; analysis: NightlyAnalysis | null }

export async function listNightlyReviews(userId: number): Promise<NightlyReview[]> {
  const rows = await sql`SELECT study_date::text AS date, record_count, minutes, analysis
    FROM study_nightly_reviews WHERE user_id = ${userId} ORDER BY study_date DESC LIMIT 14`
  return rows.map(row => ({
    date: String(row.date), recordCount: Number(row.record_count), minutes: Number(row.minutes),
    analysis: parseNightlyAnalysis(row.analysis),
  }))
}

export async function getNightlyOwner() {
  const rows = await sql`SELECT id FROM users WHERE role = 'admin' ORDER BY id LIMIT 2`
  const id = Number(rows[0]?.id)
  if (rows.length !== 1 || !Number.isSafeInteger(id) || id < 1) throw new Error('晚间复盘需要唯一的管理员账号。')
  return id
}

export async function hasNightlyReview(userId: number, date: string) {
  return (await sql`SELECT 1 FROM study_nightly_reviews WHERE user_id = ${userId} AND study_date = ${date}::date`).length > 0
}

export async function loadNightlyRecords(userId: number, date: string) {
  const rows = await sql`SELECT title, track, minutes, outcome, review, COUNT(*) OVER () AS record_count,
    SUM(minutes) OVER () AS total_minutes
    FROM study_records WHERE user_id = ${userId} AND study_date = ${date}::date AND NOT sync_removed
    ORDER BY (outcome = 'again') DESC, (outcome = 'hinted') DESC, recorded_at ASC, id ASC LIMIT 60`
  const records = rows.map(({ title, track, minutes, outcome, review }) => ({ title, track, minutes, outcome, review }) as ReviewRecord)
  return { records, recordCount: Number(rows[0]?.record_count ?? 0), minutes: Number(rows[0]?.total_minutes ?? 0) }
}

export async function saveNightlyReview(userId: number, review: NightlyReview) {
  const rows = await sql`INSERT INTO study_nightly_reviews (user_id, study_date, record_count, minutes, analysis)
    SELECT id, ${review.date}::date, ${review.recordCount}, ${review.minutes},
      ${review.analysis ? JSON.stringify(review.analysis) : null}::jsonb
    FROM users WHERE id = ${userId} AND role = 'admin'
    ON CONFLICT (user_id, study_date) DO NOTHING RETURNING study_date`
  return rows.length === 1
}
