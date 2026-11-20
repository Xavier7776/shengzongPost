import { parseStudyPlan, type SavedPlan, type StudyPlan } from '@/features/study-plan/model'
import { sql } from './_core'

export async function loadStudyPlan(userId: number): Promise<SavedPlan | null> {
  const [row] = await sql`SELECT snapshot, revision FROM study_plans WHERE user_id = ${userId}`
  if (!row) return null
  const snapshot = parseStudyPlan(row.snapshot)
  if (!snapshot) throw new Error('Invalid stored study plan')
  return { snapshot, revision: Number(row.revision) }
}

export async function saveStudyPlan(userId: number, snapshot: StudyPlan, revision: number): Promise<SavedPlan | null> {
  const json = JSON.stringify(snapshot)
  const [row] = revision === 0
    ? await sql`INSERT INTO study_plans (user_id, snapshot) VALUES (${userId}, ${json}::jsonb)
        ON CONFLICT (user_id) DO NOTHING RETURNING revision`
    : await sql`UPDATE study_plans SET snapshot = ${json}::jsonb, revision = revision + 1, updated_at = NOW()
        WHERE user_id = ${userId} AND revision = ${revision} RETURNING revision`
  return row ? { snapshot, revision: Number(row.revision) } : null
}
