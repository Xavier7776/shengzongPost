export const LEARN_PROGRESS_KEY = 'mindstack:learn-progress'
export const MAX_LEARN_PROGRESS = 100
export type LearningState = 'not_started' | 'in_progress' | 'practice_done' | 'completed'
export const learningLabels = { not_started: '未开始学习', in_progress: '学习中', practice_done: '已确认实践', completed: '已完成' }
export interface LearningProgress {
  slug: string
  title: string
  fingerprint: string
  state: Exclude<LearningState, 'not_started'>
  answers: Record<string, number>
  practiceDone: boolean
  position: number
  section: string
  updatedAt: number
  completedAt: number | null
}
export type ProgressRecords = Record<string, LearningProgress>

export function parseLearningProgress(raw: string | null): ProgressRecords {
  try {
    if (!raw || raw.length > 200_000) return {}
    const parsed = JSON.parse(raw)
    if (parsed?.version !== 1 || !Array.isArray(parsed.records)) return {}
    const valid = parsed.records.filter((r: LearningProgress) => r &&
      typeof r.slug === 'string' && /^daily-learn-\d{4}-\d{2}-\d{2}$/.test(r.slug) &&
      typeof r.title === 'string' && r.title.length <= 220 &&
      typeof r.fingerprint === 'string' && /^[a-f0-9]{64}$/.test(r.fingerprint) &&
      ['in_progress', 'practice_done', 'completed'].includes(r.state) &&
      typeof r.practiceDone === 'boolean' && Number.isFinite(r.updatedAt) && r.updatedAt > 0 &&
      Number.isFinite(r.position) && r.position >= 0 && r.position <= 10_000_000 &&
      typeof r.section === 'string' && r.section.length <= 220 &&
      (r.completedAt === null || (Number.isFinite(r.completedAt) && r.completedAt > 0)) &&
      (r.state !== 'completed' || (r.practiceDone && r.completedAt !== null)) &&
      r.answers && typeof r.answers === 'object' && !Array.isArray(r.answers) &&
      Object.keys(r.answers).length <= 80 && Object.entries(r.answers).every(([k, v]) => /^\d{1,2}$/.test(k) && Number.isInteger(v) && Number(v) >= 0 && Number(v) < 10)
    ) as LearningProgress[]
    valid.sort((a, b) => b.updatedAt - a.updatedAt)
    const records: ProgressRecords = {}
    for (const r of valid) if (!records[r.slug] && Object.keys(records).length < MAX_LEARN_PROGRESS) records[r.slug] = r
    return records
  } catch { return {} }
}

export function serializeLearningProgress(records: ProgressRecords) {
  return JSON.stringify({ version: 1, records: Object.values(records).sort((a, b) => b.updatedAt - a.updatedAt).slice(0, MAX_LEARN_PROGRESS) })
}

export function selfTestPassed(answers: Record<string, number>, correct: Record<string, number>) {
  const questions = Object.entries(correct)
  return questions.length > 0 && questions.every(([id, answer]) => answers[id] === answer)
}

export function learningState(practiceDone: boolean, passed: boolean, completedAt: number | null): Exclude<LearningState, 'not_started'> {
  return practiceDone && passed && completedAt !== null ? 'completed' : practiceDone ? 'practice_done' : 'in_progress'
}
