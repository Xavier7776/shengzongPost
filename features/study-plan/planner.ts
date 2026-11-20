import { studyPilotTitles } from '@/features/study-records/study-pilot-titles'
import type { Outcome, SavedEntry } from '@/features/study-records/model'
import { algorithms, sourceLinks, stages } from './curriculum'
import { addDays, addMonths, defaultDay, type Focus, type StudyPlan } from './model'

type Track = Exclude<Focus, 'balanced' | 'ai'>
type Unit = { id: string; title: string; track: Track; phase: number; minutes: number; reviewable: boolean; url?: string }
type Progress = { stage: number; due: string; outcome: Outcome; last: string }
export type PlannedTask = { id: string; title: string; minutes: number; track: Focus; review: boolean; url?: string }
const foundations = [1, 206, 3, 102, 33, 198, 49, 128, 283, 11, 15, 438, 560, 239, 76, 53, 56, 189, 238, 41]
const projects = [[1], [6, 4], [7, 2, 5], [11, 3], [8, 9, 10], [12]]
const secondTopics = new Set(['普通数组', '矩阵', '链表', '二叉树'])
const thirdTopics = new Set(['图论', '回溯', '二分查找', '栈', '堆'])
const aiTopics = new Set(['java-23', 'java-27', 'project-8', 'project-9'])
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
    return lesson('hw-' + number, 'hardware', findPhase(number, [6, 9, 14, 17, 22, 24]), 60, false,
      sourceLinks['hw-' + number] ?? (number <= 3 ? 'https://www.falstad.com/circuit/' : undefined))
  }),
]

const byTitle = new Map(catalog.map(unit => [unit.title, unit]))
const gaps = [1, 3, 7, 21]

export function getPlanStage(startDate: string, date: string) {
  if (date < startDate) return null
  return stages.find(s => date < addMonths(startDate, s.month)) ?? stages[stages.length - 1]
}

export function planDay(plan: StudyPlan, date: string, records: SavedEntry[]) {
  const stage = getPlanStage(plan.startDate, date)
  const options = plan.days[date] ?? defaultDay
  const weekday = new Date(date + 'T00:00:00Z').getUTCDay()
  const weekend = weekday === 6 || weekday === 0
  const regular = options.minutes ?? (weekend ? plan.weekendMinutes : plan.weekdayMinutes)
  const budget = options.mode === 'rest' ? 0 : options.mode === 'busy' ? Math.min(30, regular) : regular
  const completed = records.filter(record => record.date === date)
  const spent = completed.reduce((total, record) => total + record.minutes, 0)
  const tasks: PlannedTask[] = []
  if (!stage || budget <= spent) return { stage, budget, spent, tasks }
  const month = stage.month

  let remaining = budget - spent
  const used = new Set<string>()
  const progress = new Map<string, Progress>()
  const customDone = completed.some(entry => entry.title === options.extra?.title)
  for (const entry of records.filter(r => r.date <= date).sort((a, b) => a.date.localeCompare(b.date) || a.recordedAt - b.recordedAt)) {
    const unit = byTitle.get(entry.title)
    if (!unit) continue
    if (entry.date === date) used.add(unit.id)
    const previous = progress.get(unit.id)?.stage ?? 0
    const independent = entry.outcome === 'independent'
    progress.set(unit.id, { stage: independent ? Math.min(3, previous + 1) : 0,
      due: addDays(entry.date, independent ? gaps[previous] : 1), outcome: entry.outcome, last: entry.date })
  }

  function add(unit: Unit, minutes: number, review = false) {
    if (used.has(unit.id) || minutes > remaining) return false
    used.add(unit.id)
    const base = unit.id.match(/^java-\d+/)?.[0] ?? unit.id
    tasks.push({ id: unit.id, title: unit.title, track: aiTopics.has(base) ? 'ai' : unit.track, review, minutes, url: unit.url })
    remaining -= minutes
    return true
  }

  const due = catalog.filter(unit => unit.reviewable && !used.has(unit.id) && (progress.get(unit.id)?.due ?? '9999') <= date)
    .sort((a, b) => {
      const first = progress.get(a.id)!
      const second = progress.get(b.id)!
      return first.due.localeCompare(second.due) || first.stage - second.stage
    })
  for (const unit of due) if (!add(unit, 15, true)) return { stage, budget, spent, tasks }

  if (options.extra && !customDone && options.extra.minutes <= remaining) {
    tasks.push({ ...options.extra, id: 'custom', track: 'balanced', review: false })
    remaining -= options.extra.minutes
  }

  function available(focus: Exclude<Focus, 'balanced'>) {
    return catalog.filter(unit => unit.phase <= month && (focus === 'ai'
      ? aiTopics.has(unit.id.match(/^java-\d+/)?.[0] ?? unit.id) : unit.track === focus))
      .sort((a, b) => (focus === 'hardware' ? a.phase - b.phase
        : (a.phase === month ? 0 : a.phase) - (b.phase === month ? 0 : b.phase)))
  }
  const missing = (unit: Unit) => (prerequisites[unit.id] ?? []).filter(id => progress.get(id)?.outcome !== 'independent')
  function fresh(focus: Exclude<Focus, 'balanced'>, minutes?: number, fit = false) {
    const units = available(focus)
    for (const unit of units) {
      const prev = progress.get(unit.id)
      if (prev && (unit.reviewable || prev.outcome !== 'again')) continue
      if (missing(unit).length) continue
      const duration = minutes ?? (fit ? Math.min(unit.minutes, remaining) : unit.minutes)
      if (add(unit, duration)) return true
    }
    if (focus !== 'hardware') return false
    const needs = new Set(units.filter(unit => !used.has(unit.id) && !progress.has(unit.id)).flatMap(missing))
    return units.some(unit => needs.has(unit.id) && add(unit, unit.minutes))
  }

  const outcomeRank: Record<Outcome, number> = { again: 0, hinted: 1, independent: 2 }
  function repeatAlgorithm(minutes: number) {
    const prior = available('algorithm').filter(unit => !used.has(unit.id) && (progress.get(unit.id)?.last ?? '9999') < date)
      .sort((a, b) => {
        const first = progress.get(a.id)!
        const second = progress.get(b.id)!
        return outcomeRank[first.outcome] - outcomeRank[second.outcome] || first.last.localeCompare(second.last)
      })
    return prior[0] ? add(prior[0], minutes, true) : false
  }

  const algorithm = (short?: number) => (month >= 5 && repeatAlgorithm(short ?? 30)) || fresh('algorithm', short)

  if (options.focus !== 'balanced') {
    const short = options.mode === 'busy' ? (options.focus === 'algorithm' ? 20 : 10) : undefined
    const minimum = options.focus === 'algorithm' ? 20 : options.focus === 'hardware' || options.focus === 'project' ? 30 : 10
    if (short !== undefined || remaining >= minimum) {
      if (options.focus === 'algorithm') algorithm(short ?? Math.min(30, remaining))
      else fresh(options.focus, short, true)
    }
  }
  if (options.mode === 'busy') {
    if (options.focus !== 'backend') fresh('backend', 10)
    if (options.focus !== 'algorithm' && (due.length === 0 || remaining >= 20)) algorithm(20)
  } else if (weekend) {
    if (options.focus !== 'hardware') fresh('hardware')
    if (options.focus !== 'project') fresh('project')
    if (options.focus !== 'algorithm') algorithm()
  } else {
    if (options.focus !== 'algorithm') algorithm()
    if (options.focus !== 'backend') fresh('backend')
    if (!fresh('algorithm') && month >= 5) repeatAlgorithm(30)
  }
  return { stage, budget, spent, tasks }
}
