import { sql } from './_core'
import type { Entry, EntryWithId, SavedEntry } from '@/features/study-records/model'

type StudyRow = Omit<SavedEntry, 'date' | 'recordedAt'> & { study_date: string; recorded_at: string }

function studyEntry(row: Record<string, unknown>): SavedEntry {
  const { study_date, recorded_at, ...entry } = row as StudyRow
  return { ...entry, date: study_date, recordedAt: Number(recorded_at) }
}

export async function listStudyRecords(userId: number): Promise<SavedEntry[]> {
  const rows = await sql`SELECT id, study_date::text, title, track, minutes, outcome, note, review, recorded_at, revision
    FROM study_records WHERE user_id = ${userId} AND NOT sync_removed
    ORDER BY study_date DESC, recorded_at DESC, id DESC`
  return rows.map(studyEntry)
}

export async function insertStudyRecords(userId: number, entries: EntryWithId[], restoreRemoved = false): Promise<SavedEntry[]> {
  // A backup may include a repeated ID. PostgreSQL can only update a conflicting row once per INSERT.
  const distinct = [...new Map(entries.map(entry => [entry.id, entry])).values()]
  const rows = await sql`INSERT INTO study_records
    (user_id, id, study_date, title, track, minutes, outcome, note, review, recorded_at)
    SELECT ${userId}, id, date, title, track, minutes, outcome, note, review, "recordedAt"
    FROM jsonb_to_recordset(${JSON.stringify(distinct)}::jsonb)
      AS entry(id TEXT, date DATE, title TEXT, track TEXT, minutes INTEGER, outcome TEXT,
               note TEXT, review BOOLEAN, "recordedAt" BIGINT)
    ON CONFLICT (user_id, id) DO UPDATE SET study_date = EXCLUDED.study_date, title = EXCLUDED.title,
      track = EXCLUDED.track, minutes = EXCLUDED.minutes, outcome = EXCLUDED.outcome, note = EXCLUDED.note,
      review = EXCLUDED.review, recorded_at = EXCLUDED.recorded_at, sync_removed = FALSE,
      revision = study_records.revision + 1
    WHERE ${restoreRemoved}::boolean AND study_records.sync_removed
    RETURNING id, study_date::text, title, track, minutes, outcome, note, review, recorded_at, revision`
  return rows.map(studyEntry)
}

export async function updateStudyRecord(userId: number, id: string, revision: number, entry: Entry) {
  const rows = await sql`UPDATE study_records SET study_date = ${entry.date}, title = ${entry.title},
    track = ${entry.track}, minutes = ${entry.minutes}, outcome = ${entry.outcome}, note = ${entry.note},
    review = ${entry.review}, revision = revision + 1
    WHERE user_id = ${userId} AND id = ${id} AND revision = ${revision} AND NOT sync_removed
    RETURNING id, study_date::text, title, track, minutes, outcome, note, review, recorded_at, revision`
  return rows[0] ? studyEntry(rows[0]) : null
}

export async function deleteStudyRecord(userId: number, id: string, revision: number) {
  // Keep the mobile ID so replaying the phone's history cannot restore a deleted entry.
  const rows = id.startsWith('android:')
    ? await sql`UPDATE study_records SET sync_removed = TRUE, study_date = DATE '1000-01-01',
        title = '已删除', track = 'other', minutes = 1, outcome = 'again', note = '', review = FALSE,
        recorded_at = 0, revision = revision + 1
        WHERE user_id = ${userId} AND id = ${id} AND revision = ${revision} AND NOT sync_removed RETURNING id`
    : await sql`DELETE FROM study_records
    WHERE user_id = ${userId} AND id = ${id} AND revision = ${revision} RETURNING id`
  return rows.length > 0
}
