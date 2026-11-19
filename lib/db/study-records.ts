import { sql } from './_core'
import type { Entry, EntryWithId, SavedEntry } from '@/features/study-records/model'

type StudyRow = Omit<SavedEntry, 'date' | 'recordedAt'> & { study_date: string; recorded_at: string }

function studyEntry(row: Record<string, unknown>): SavedEntry {
  const { study_date, recorded_at, ...entry } = row as StudyRow
  return { ...entry, date: study_date, recordedAt: Number(recorded_at) }
}

export async function listStudyRecords(userId: number): Promise<SavedEntry[]> {
  const rows = await sql`SELECT id, study_date::text, title, track, minutes, outcome, note, review, recorded_at, revision
    FROM study_records WHERE user_id = ${userId}
    ORDER BY study_date DESC, recorded_at DESC, id DESC`
  return rows.map(studyEntry)
}

export async function insertStudyRecords(userId: number, entries: EntryWithId[]): Promise<SavedEntry[]> {
  const rows = await sql`INSERT INTO study_records
    (user_id, id, study_date, title, track, minutes, outcome, note, review, recorded_at)
    SELECT ${userId}, id, date, title, track, minutes, outcome, note, review, "recordedAt"
    FROM jsonb_to_recordset(${JSON.stringify(entries)}::jsonb)
      AS entry(id TEXT, date DATE, title TEXT, track TEXT, minutes INTEGER, outcome TEXT,
               note TEXT, review BOOLEAN, "recordedAt" BIGINT)
    ON CONFLICT (user_id, id) DO NOTHING
    RETURNING id, study_date::text, title, track, minutes, outcome, note, review, recorded_at, revision`
  return rows.map(studyEntry)
}

export async function updateStudyRecord(userId: number, id: string, revision: number, entry: Entry) {
  const rows = await sql`UPDATE study_records SET study_date = ${entry.date}, title = ${entry.title},
    track = ${entry.track}, minutes = ${entry.minutes}, outcome = ${entry.outcome}, note = ${entry.note},
    review = ${entry.review}, revision = revision + 1
    WHERE user_id = ${userId} AND id = ${id} AND revision = ${revision}
    RETURNING id, study_date::text, title, track, minutes, outcome, note, review, recorded_at, revision`
  return rows[0] ? studyEntry(rows[0]) : null
}

export async function deleteStudyRecord(userId: number, id: string, revision: number) {
  const rows = await sql`DELETE FROM study_records
    WHERE user_id = ${userId} AND id = ${id} AND revision = ${revision} RETURNING id`
  return rows.length > 0
}
