export const tracks = {
  algorithm: '算法题',
  backend: 'Java 后端',
  ai: 'AI 系统工程',
  project: '项目实践',
  hardware: '嵌入式与硬件',
  other: '其他',
} as const

export const outcomes = {
  independent: '独立完成',
  hinted: '提示后完成',
  again: '还需再练',
} as const

export type Track = keyof typeof tracks
export type Outcome = keyof typeof outcomes

export type Entry = {
  title: string
  track: Track
  date: string
  minutes: number
  outcome: Outcome
  note: string
  review: boolean
}

export type EntryWithId = Entry & { id: string; recordedAt: number }
export type SavedEntry = EntryWithId & { revision: number }

export const limits = { title: 160, note: 4000, minutes: 600 } as const
export const importBatchSize = 200
export const maxBackupBytes = 32 * 1024 * 1024
export const webBackupFormat = 'mindstack-study-records'

export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function isStudyDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^[1-9]\d{3}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(value + 'T00:00:00Z')
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value
}

export function isTrack(value: unknown): value is Track {
  return typeof value === 'string' && Object.hasOwn(tracks, value)
}

export function isOutcome(value: unknown): value is Outcome {
  return typeof value === 'string' && Object.hasOwn(outcomes, value)
}

export function isId(value: unknown): value is string {
  return typeof value === 'string' && /^(web|android):[a-z0-9_-]{1,180}$/i.test(value)
}

export function isRecordedAt(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 && value <= 253402300799999
}

export function parseEntry(input: unknown): Entry | null {
  if (!isObject(input)) return null
  const { title, track, date, minutes, outcome, note, review } = input
  if (typeof title !== 'string' || !title.trim() || title.length > limits.title || title.includes('\0')
    || !isTrack(track) || !isStudyDate(date) || !isOutcome(outcome)
    || typeof minutes !== 'number' || !Number.isInteger(minutes) || minutes < 1 || minutes > limits.minutes
    || typeof note !== 'string' || note.length > limits.note || note.includes('\0') || typeof review !== 'boolean') return null
  return { title: title.trim(), track, date, minutes, outcome, note, review }
}

export function parseIdentifiedEntry(input: unknown): EntryWithId | null {
  if (!isObject(input) || !isId(input.id) || !isRecordedAt(input.recordedAt)) return null
  const entry = parseEntry(input)
  return entry && { ...entry, id: input.id, recordedAt: input.recordedAt }
}
