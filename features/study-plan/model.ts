import { isObject, isStudyDate } from '@/features/study-records/model'

export const focusLabels = {
  balanced: '按原计划',
  algorithm: '算法题',
  backend: 'Java 后端',
  ai: 'AI 系统工程',
  project: '项目实践',
  hardware: '嵌入式与硬件',
} as const
export const modeLabels = { normal: '标准', busy: '忙碌（最多 30 分钟）', rest: '休息' } as const
export type Focus = keyof typeof focusLabels
export type Mode = keyof typeof modeLabels
export type ExtraTask = { title: string; minutes: number }
export type DayOverride = { minutes: number | null; mode: Mode; focus: Focus; extra: ExtraTask | null }
export type StudyPlan = {
  startDate: string
  weekdayMinutes: number
  weekendMinutes: number
  sundayRest: boolean
  days: Record<string, DayOverride>
}
export type Adjustment = { date: string; day: DayOverride }
export type Proposal = { explanation: string; changes: Adjustment[] }
export type SavedPlan = { snapshot: StudyPlan; revision: number }

export const defaultDay: DayOverride = { minutes: null, mode: 'normal', focus: 'balanced', extra: null }

export const defaultPlan = (startDate: string): StudyPlan => ({
  startDate, weekdayMinutes: 90, weekendMinutes: 150, sundayRest: false, days: {},
})

export function isPlanDate(value: unknown): value is string {
  return isStudyDate(value) && value >= '1900-01-01' && value <= '2100-12-31'
}

function isMinutes(value: unknown, min = 1): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= min && value <= 1440
}

function textValue(value: unknown, max: number) {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= max && !value.includes('\0')
    ? value.trim() : null
}

export function parseDay(value: unknown): DayOverride | null {
  if (!isObject(value)) return null
  const { minutes, mode, focus, extra } = value
  if ((minutes !== null && !isMinutes(minutes, 0)) || typeof mode !== 'string' || !Object.hasOwn(modeLabels, mode)
    || typeof focus !== 'string' || !Object.hasOwn(focusLabels, focus)) return null
  const flags = { minutes, mode: mode as Mode, focus: focus as Focus }
  if (extra === null) return { ...flags, extra: null }
  if (!isObject(extra) || !isMinutes(extra.minutes)) return null
  const title = textValue(extra.title, 120)
  return title ? { ...flags, extra: { title, minutes: extra.minutes } } : null
}

export function parseStudyPlan(value: unknown): StudyPlan | null {
  if (!isObject(value) || !isPlanDate(value.startDate) || !isMinutes(value.weekdayMinutes)
    || !isMinutes(value.weekendMinutes) || (value.sundayRest !== undefined && typeof value.sundayRest !== 'boolean')
    || !isObject(value.days)) return null
  const entries = Object.entries(value.days)
  if (entries.length > 730) return null
  const days: StudyPlan['days'] = {}
  for (const [day, data] of entries) {
    const override = parseDay(data)
    if (!isPlanDate(day) || !override) return null
    days[day] = override
  }
  return { startDate: value.startDate, weekdayMinutes: value.weekdayMinutes, weekendMinutes: value.weekendMinutes,
    sundayRest: value.sundayRest ?? false, days }
}

export function addDays(value: string, days: number) {
  const date = new Date(value + 'T00:00:00Z')
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

export function startOfWeek(value: string) {
  const weekday = new Date(value + 'T00:00:00Z').getUTCDay()
  return addDays(value, -((weekday + 6) % 7))
}

export function addMonths(value: string, months: number) {
  const date = new Date(value + 'T00:00:00Z')
  const day = date.getUTCDate()
  date.setUTCDate(1)
  date.setUTCMonth(date.getUTCMonth() + months)
  const last = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate()
  date.setUTCDate(Math.min(day, last))
  return date.toISOString().slice(0, 10)
}

export function parseProposal(value: unknown, date: string): Proposal | null {
  if (!isObject(value) || !Array.isArray(value.changes) || value.changes.length > 7) return null
  const explanation = textValue(value.explanation, value.changes.length ? 400 : 1200)
  if (!explanation) return null
  const latest = addDays(date, 7)
  const seen = new Set<string>()
  const changes: Adjustment[] = []
  for (const change of value.changes) {
    if (!isObject(change) || !isPlanDate(change.date) || change.date < date || change.date > latest || seen.has(change.date)) return null
    const day = parseDay(change.day)
    if (!day) return null
    seen.add(change.date)
    changes.push({ date: change.date, day })
  }
  return { explanation, changes: changes.sort((a, b) => a.date.localeCompare(b.date)) }
}

export function importMobilePlan(input: string, current: StudyPlan): StudyPlan | null {
  let data: unknown
  try { data = JSON.parse(input) } catch { return null }
  if (!isObject(data) || data.format !== 'studypilot-backup' || data.version !== 1
    || !isObject(data.settings) || !Array.isArray(data.dayModes)) return null
  const days = { ...current.days }
  for (const row of data.dayModes) {
    if (!isObject(row) || !isPlanDate(row.date) || !['NORMAL', 'BUSY', 'REST'].includes(row.mode as string)) return null
    if (!days[row.date]) days[row.date] = { ...defaultDay, mode: (row.mode as string).toLowerCase() as Mode }
  }
  return parseStudyPlan({ ...data.settings, sundayRest: current.sundayRest, days })
}
