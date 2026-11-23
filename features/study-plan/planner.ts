import { studyPilotTitles } from '@/features/study-records/study-pilot-titles'
import type { Outcome, SavedEntry } from '@/features/study-records/model'
import { algorithms, sourceLinks, stages } from './curriculum'
import { addDays, addMonths, defaultDay, startOfWeek, type DayOverride, type DeferredTask, type Focus, type StudyPlan } from './model'

type Track = Exclude<Focus, 'balanced' | 'ai'>
type Unit = { id: string; title: string; track: Track; phase: number; minutes: number; reviewable: boolean; url?: string }
type Progress = { stage: number; due: string; outcome: Outcome; last: string }
export type PlannedTask = { id: string; title: string; minutes: number; track: Focus; review: boolean; practice?: boolean; url?: string; deferred?: true }
type Deferred = { unit?: Unit; task: PlannedTask }
export type PlannedDay = {
  stage: (typeof stages)[number] | null
  budget: number
  sundayRest: boolean
  paused: boolean
  spent: number
  dueCount: number
  tasks: PlannedTask[]
  completed: SavedEntry[]
}
const foundations = [1, 206, 3, 102, 33, 198, 49, 128, 283, 11, 15, 438, 560, 239, 76, 53, 56, 189, 238, 41]
const projects = [[1], [6, 4], [7, 2, 5], [11, 3], [8, 9, 10], [12]]
const secondTopics = new Set(['普通数组', '矩阵', '链表', '二叉树'])
const thirdTopics = new Set(['图论', '回溯', '二分查找', '栈', '堆'])
const aiTopics = new Set(['java-23', 'java-27', 'project-8', 'project-9'])
const isAiUnit = (unit: Unit) => aiTopics.has(unit.id.match(/^java-\d+/)?.[0] ?? unit.id)
const isCoreJava = (unit: Unit) => !isAiUnit(unit)
const weekendJavaMinutes = 30
const prerequisites: Partial<Record<string, string[]>> = {
  'hw-18': ['hw-9', 'hw-11'],
  'hw-19': ['hw-9', 'hw-11', 'hw-16', 'hw-17'],
  'hw-20': ['hw-9', 'hw-11', 'hw-16', 'hw-17', 'hw-19'],
  'hw-21': ['hw-9', 'hw-11', 'hw-16', 'hw-17', 'hw-20'],
  'hw-22': ['hw-16'],
  'hw-24': ['hw-16', 'hw-23'],
}

const lesson = (id: string, track: Track, phase: number, minutes: number, reviewable: boolean, url = sourceLinks[id]): Unit =>
  ({ id, title: studyPilotTitles[id] ?? id, track, phase, minutes, reviewable, url })

const titleStages = [['read', '理解'], ['lab', '验证'], ['recall', '复述']] as const
const findPhase = (number: number, boundaries: number[]) => boundaries.findIndex(max => number <= max) + 1
const algorithmOrder = (id: number) => foundations.includes(id) ? foundations.indexOf(id) : foundations.length
const catalog: Unit[] = [
  ...[...algorithms].sort(([a], [b]) => algorithmOrder(a) - algorithmOrder(b)).map(([number, slug, topic]) =>
    lesson('lc-' + number, 'algorithm', foundations.includes(number) ? 1 : secondTopics.has(topic) ? 2 : thirdTopics.has(topic) ? 3 : 4,
      30, true, 'https://leetcode.cn/problems/' + slug + '/')),
  ...Array.from({ length: 27 }, (_, index) => {
    const number = index + 1
    const base = lesson('java-' + number, 'backend', findPhase(number, [6, 14, 19, 22, 24, 27]), 30, true)
    return number > 24 ? [base] : titleStages.map(([suffix, label]) => ({
      ...base, id: base.id + '-' + suffix, title: base.title + ' · ' + label, reviewable: suffix === 'recall',
    }))
  }).flat(),
  ...projects.flatMap((group, i) => group.map(number => lesson('project-' + number, 'project', i + 1, 45, false))),
  ...Array.from({ length: 24 }, (_, index) => {
    const number = index + 1
    return lesson('hw-' + number, 'hardware', findPhase(number, [6, 9, 14, 17, 22, 24]), 60, false)
  }),
]

const byTitle = new Map(catalog.map(unit => [unit.title, unit]))
const byId = new Map(catalog.map(unit => [unit.id, unit]))
const gaps = [1, 3, 7, 21]

export function getPlanStage(startDate: string, date: string) {
  if (date < startDate) return null
  return stages.find(s => date < addMonths(startDate, s.month)) ?? stages[stages.length - 1]
}

export function planDay(plan: StudyPlan, date: string, records: readonly SavedEntry[]) {
  return planSchedule(plan, date, date, date, records).get(date)!
}

export function deferDay(day: PlannedDay, options: DayOverride): DeferredTask[] {
  const tasks = day.tasks.filter(task => !task.review && !task.deferred).map(task => ({
    id: task.id, minutes: task.minutes,
    ...(task.practice && { practice: true as const }), ...(task.id === 'custom' && { title: task.title }),
  }))
  if (options.extra && !tasks.some(task => task.id === 'custom') && !day.completed.some(entry => entry.title === options.extra?.title)) {
    tasks.unshift({ ...options.extra, id: 'custom' })
  }
  return tasks
}

export function planSchedule(plan: StudyPlan, first: string, last: string, today: string, records: readonly SavedEntry[]) {
  const firstWeek = startOfWeek(first)
  const forecastStart = firstWeek > addMonths(today, 6) ? firstWeek : today
  // Carry today's queue forward, even when the visible week starts in the future.
  const start = first < forecastStart ? first : forecastStart
  const history = [...records].sort((a, b) => a.date.localeCompare(b.date) || a.recordedAt - b.recordedAt)
  const progress = new Map<string, Progress>()
  const allocated = new Map<string, string>()
  const deferred = new Map<string, Deferred>()
  const pauses = Object.entries(plan.pauses ?? {}).sort(([a], [b]) => a.localeCompare(b))
  let pauseIndex = 0

  function readPausesThrough(date: string) {
    for (; pauseIndex < pauses.length && pauses[pauseIndex][0] <= date; pauseIndex++) {
      const [origin, items] = pauses[pauseIndex]
      for (const item of items) {
        const unit = byId.get(item.id)
        const id = item.id === 'custom' ? `custom:${origin}` : item.id
        const title = unit?.title ?? item.title
        if (!title || deferred.has(id)) continue
        deferred.set(id, { unit, task: { id, title, minutes: item.minutes, review: false,
          track: unit ? (isAiUnit(unit) ? 'ai' : unit.track) : 'balanced', deferred: true, practice: item.practice, url: unit?.url } })
      }
    }
  }

  const result = new Map<string, PlannedDay>()
  let cursor = 0
  for (let date = start; date <= last; date = addDays(date, 1)) {
    const completed: SavedEntry[] = []
    for (; cursor < history.length && history[cursor].date <= date; cursor++) {
      const entry = history[cursor]
      if (entry.date === date) completed.push(entry)
      readPausesThrough(entry.date)
      const unit = byTitle.get(entry.title)
      if (unit && deferred.has(unit.id)) deferred.delete(unit.id)
      else if (!unit || entry.track === 'other') {
        const custom = [...deferred.values()].find(item => !item.unit && item.task.title === entry.title)
        if (custom) deferred.delete(custom.task.id)
      }
      if (!unit) continue
      const previous = progress.get(unit.id)?.stage ?? 0
      const independent = entry.outcome === 'independent'
      progress.set(unit.id, { stage: independent ? Math.min(3, previous + 1) : 0,
        due: addDays(entry.date, independent ? gaps[previous] : 1), outcome: entry.outcome, last: entry.date })
      // A recorded session starts its own review cycle, even when it follows a projected session.
      allocated.delete(unit.id)
    }
    readPausesThrough(date)
    if (date < first && date < plan.startDate) continue
    const day = buildDay(plan, date, completed, progress, allocated, deferred)
    if (date >= first) result.set(date, day)
    // Projections reserve a slot. Review intervals and prerequisites still follow real records.
    if (date >= today) for (const task of day.tasks) if (task.id !== 'custom') allocated.set(task.id, date)
  }
  return result
}

function buildDay(plan: StudyPlan, date: string, completed: SavedEntry[], progress: Map<string, Progress>,
  allocated: Map<string, string>, deferred: Map<string, Deferred>): PlannedDay {
  const stage = getPlanStage(plan.startDate, date)
  const options = plan.days[date] ?? defaultDay
  const weekday = new Date(date + 'T00:00:00Z').getUTCDay()
  const weekend = weekday === 6 || weekday === 0
  const sundayRest = plan.sundayRest && weekday === 0
  const paused = Object.hasOwn(plan.pauses ?? {}, date)
  const regular = options.minutes ?? (weekend ? plan.weekendMinutes : plan.weekdayMinutes)
  const budget = paused || sundayRest || options.mode === 'rest' ? 0 : options.mode === 'busy' ? Math.min(30, regular) : regular
  const spent = completed.reduce((total, record) => total + record.minutes, 0)
  const result: PlannedDay = { stage, budget, sundayRest, paused, spent, dueCount: 0, tasks: [], completed }
  if (!stage) return result

  let remaining = budget - spent
  const used = new Set(completed.map(entry => byTitle.get(entry.title)?.id))
  const customDone = completed.some(entry => entry.title === options.extra?.title)
  const unavailable = (id: string) => used.has(id) || allocated.has(id)
  const month = stage.month

  function add(unit: Unit, minutes: number, review = false, practice = false) {
    if (used.has(unit.id) || (!practice && allocated.has(unit.id)) || (!review && deferred.has(unit.id))
      || minutes <= 0 || minutes > remaining) return false
    used.add(unit.id)
    result.tasks.push({ id: unit.id, title: unit.title, track: isAiUnit(unit) ? 'ai' : unit.track, review, practice, minutes, url: unit.url })
    remaining -= minutes
    return true
  }

  const due = catalog.filter(unit => unit.reviewable && !unavailable(unit.id) && (progress.get(unit.id)?.due ?? '9999') <= date)
    .sort((a, b) => {
      const first = progress.get(a.id)!
      const second = progress.get(b.id)!
      return first.due.localeCompare(second.due) || first.stage - second.stage
    })
  result.dueCount = due.length
  for (const unit of due) if (!add(unit, 15, true)) return result
  if (remaining <= 0) return result

  if (options.extra && !customDone && options.extra.minutes <= remaining) {
    result.tasks.push({ ...options.extra, id: 'custom', track: 'balanced', review: false })
    remaining -= options.extra.minutes
  }

  const missing = (unit: Unit) => (prerequisites[unit.id] ?? []).filter(id => progress.get(id)?.outcome !== 'independent')
  for (const { unit, task } of deferred.values()) {
    if (task.minutes > remaining || unavailable(task.id) || (unit && (unit.phase > month || missing(unit).length))) continue
    if (!unit && result.tasks.some(existing => existing.title === task.title)) continue
    used.add(task.id)
    result.tasks.push(task)
    remaining -= task.minutes
  }

  function available(focus: Exclude<Focus, 'balanced'>) {
    return catalog.filter(unit => unit.phase <= month && (focus === 'ai' ? isAiUnit(unit) : unit.track === focus))
      .sort((a, b) => (focus === 'hardware' ? a.phase - b.phase
        : (a.phase === month ? 0 : a.phase) - (b.phase === month ? 0 : b.phase)))
  }
  function fresh(focus: Exclude<Focus, 'balanced'>, minutes?: number, fit = false, eligible?: (unit: Unit) => boolean) {
    const units = available(focus)
    for (const unit of units) {
      if (eligible && !eligible(unit)) continue
      const prev = progress.get(unit.id)
      if (prev && (unit.reviewable || prev.outcome !== 'again')) continue
      if (missing(unit).length) continue
      const duration = minutes ?? (fit ? Math.min(unit.minutes, remaining) : unit.minutes)
      if (add(unit, duration)) return true
    }
    if (focus !== 'hardware') return false
    const needs = new Set(units.filter(unit => !unavailable(unit.id) && !progress.has(unit.id)).flatMap(missing))
    return units.some(unit => needs.has(unit.id) && add(unit, minutes ?? (fit ? Math.min(unit.minutes, remaining) : unit.minutes)))
  }

  const outcomeRank: Record<Outcome, number> = { again: 0, hinted: 1, independent: 2 }
  function repeatAlgorithm(minutes: number) {
    const prior = available('algorithm').filter(unit => !unavailable(unit.id) && !deferred.has(unit.id) && (progress.get(unit.id)?.last ?? '9999') < date)
      .sort((a, b) => {
        const first = progress.get(a.id)!
        const second = progress.get(b.id)!
        return outcomeRank[first.outcome] - outcomeRank[second.outcome] || first.last.localeCompare(second.last)
      })
    return prior[0] ? add(prior[0], minutes, false, true) : false
  }

  const algorithm = (short?: number) => (month >= 5 && repeatAlgorithm(short ?? 30)) || fresh('algorithm', short)

  function practice(focus: Exclude<Focus, 'balanced'>, limit: number, eligible?: (unit: Unit) => boolean) {
    const cutoff = addDays(date, -7)
    const lastScheduled = (id: string) => allocated.get(id) ?? progress.get(id)?.last ?? '9999'
    const candidate = available(focus)
      .filter(unit => (!eligible || eligible(unit)) && !used.has(unit.id) && !deferred.has(unit.id) && !missing(unit).length && lastScheduled(unit.id) <= cutoff)
      .sort((a, b) => lastScheduled(a.id).localeCompare(lastScheduled(b.id)))
      .find(unit => limit >= (unit.track === 'backend' ? 10 : unit.track === 'algorithm' ? 20 : 30))
    return candidate ? add(candidate, Math.min(candidate.minutes, limit), false, true) : false
  }

  if (options.focus !== 'balanced') {
    const short = options.mode === 'busy' ? (options.focus === 'algorithm' ? 20 : 10) : undefined
    const minimum = options.focus === 'algorithm' ? 20 : options.focus === 'hardware' || options.focus === 'project' ? 30 : 10
    if (short !== undefined || remaining >= minimum) {
      if (options.focus === 'algorithm') algorithm(short ?? Math.min(30, remaining))
      else fresh(options.focus, short, true, options.focus === 'backend' ? isCoreJava : undefined)
    }
  }
  if (options.mode === 'busy') {
    if (options.focus !== 'backend') fresh('backend', 10)
    if (options.focus !== 'algorithm' && (due.length === 0 || remaining >= 20)) algorithm(20)
  } else if (weekend) {
    const javaMinutes = completed.filter(entry => entry.track === 'backend').reduce((total, entry) => total + entry.minutes, 0)
      + result.tasks.filter(task => task.track === 'backend').reduce((total, task) => total + task.minutes, 0)
    const javaSlot = Math.min(remaining, weekendJavaMinutes - javaMinutes)
    if (javaSlot >= 10 && !fresh('backend', javaSlot, false, isCoreJava)) practice('backend', javaSlot, isCoreJava)
    if (options.focus !== 'hardware' && remaining >= 30) fresh('hardware', undefined, true)
    if (options.focus !== 'algorithm' && remaining >= 20) algorithm(Math.min(30, remaining))
    if (options.focus !== 'project' && remaining >= 30) fresh('project', undefined, true)
  } else {
    if (options.focus !== 'algorithm') algorithm()
    if (options.focus !== 'backend') fresh('backend')
    if (!fresh('algorithm') && month >= 5) repeatAlgorithm(30)
  }
  // A short remaining slot is still useful, especially after completing part of today's plan.
  if (!weekend && remaining >= 10 && remaining < 30 && options.mode === 'normal') fresh('backend', remaining)
  if (result.tasks.length === 0 && remaining >= 10) {
    const directions: Exclude<Focus, 'balanced'>[] = weekend ? ['hardware', 'project', 'algorithm'] : ['backend', 'algorithm']
    if (options.focus !== 'balanced') directions.unshift(options.focus)
    directions.some(direction => practice(direction, remaining))
  }
  return result
}
