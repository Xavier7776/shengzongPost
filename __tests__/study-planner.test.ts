import { describe, expect, it } from 'vitest'
import { addMonths, defaultDay, defaultPlan, importMobilePlan, parseProposal } from '@/features/study-plan/model'
import { getPlanStage, planDay, planSchedule } from '@/features/study-plan/planner'
import type { SavedEntry } from '@/features/study-records/model'

describe('StudyPilot web plan', () => {
  const day = '2026-11-20'
  const prior: SavedEntry = {
    id: 'android:fixture', title: '1. 两数之和', track: 'algorithm', date: '2026-11-19', minutes: 30,
    outcome: 'independent', recordedAt: 1795080000000, revision: 1, note: '不发送给 AI 的私人笔记', review: false,
  }
  it('uses the original weekday and weekend curriculum', () => {
    const plan = defaultPlan(day)
    expect(planDay(plan, day, []).tasks.map(x => x.id)).toEqual(['lc-1', 'java-1-read', 'lc-206'])
    expect(planDay(plan, '2026-11-21', []).tasks.map(x => x.id)).toEqual(['hw-1', 'project-1', 'lc-1'])
  })
  it('allocates time to overdue reviews first and subtracts completed minutes', () => {
    const plan = defaultPlan('2026-11-19')
    plan.days[day] = { ...defaultDay, minutes: 45, focus: 'backend' }
    const tracked = { ...prior, id: 'web:session', title: '自定义摸底', date: day, minutes: 10 }
    const result = planDay(plan, day, [prior, tracked])
    expect(result.tasks[0]).toMatchObject({ id: 'lc-1', minutes: 15, review: true })
    expect(result.tasks[1]).toMatchObject({ id: 'java-1-read', minutes: 20 })
    expect(result.spent).toBe(10)
    expect(result.tasks.reduce((n, row) => n + row.minutes, 0)).toBeLessThanOrEqual(35)
    plan.days[day] = { ...defaultDay, minutes: 45, mode: 'rest' }
    expect(planDay(plan, day, [prior]).tasks).toEqual([])
  })
  it('projects consecutive tasks and keeps later weeks consistent when opened directly', () => {
    const plan = defaultPlan(day)
    const schedule = planSchedule(plan, day, '2026-11-29', day, [])
    const todayIds = schedule.get(day)!.tasks.map(task => task.id)
    const tomorrowIds = schedule.get('2026-11-21')!.tasks.map(task => task.id)
    expect(tomorrowIds).toEqual(['hw-1', 'project-1', 'lc-3'])
    expect(tomorrowIds.some(id => todayIds.includes(id))).toBe(false)
    const nextWeek = planSchedule(plan, '2026-11-23', '2026-11-29', day, [])
    expect(nextWeek.get('2026-11-23')!.tasks).toEqual(schedule.get('2026-11-23')!.tasks)
    expect(schedule.get('2026-11-22')!.tasks.map(task => task.id)).not.toEqual(tomorrowIds)
  })
  it('carries review overflow across a rest day and reflows from actual learning outcomes', () => {
    const plan = defaultPlan('2026-11-19')
    plan.days[day] = { ...defaultDay, minutes: 15 }
    plan.days['2026-11-21'] = { ...defaultDay, mode: 'rest' }
    const other = { ...prior, id: 'android:other', title: '206. 反转链表' }
    const records = [prior, other]
    const estimate = planSchedule(plan, day, '2026-11-22', day, records)
    expect(estimate.get(day)!.tasks.map(task => task.id)).toEqual(['lc-1'])
    expect(estimate.get(day)!.dueCount).toBe(2)
    expect(estimate.get('2026-11-21')!.tasks).toEqual([])
    expect(estimate.get('2026-11-22')!.tasks[0]).toMatchObject({ id: 'lc-206', review: true })
    const recorded = { ...prior, id: 'web:later', date: day, minutes: 15, outcome: 'again' as const, review: true }
    const adjusted = planSchedule(plan, day, '2026-11-22', day, [...records, recorded])
    expect(adjusted.get(day)!.completed).toEqual([recorded])
    expect(adjusted.get(day)!.tasks).toEqual([])
    expect(adjusted.get('2026-11-22')!.tasks.slice(0, 2).map(task => task.id)).toEqual(['lc-206', 'lc-1'])
  })
  it('keeps a usable schedule after the first set of topics has been allocated', () => {
    const schedule = planSchedule(defaultPlan(day), '2026-12-16', '2026-12-18', day, [])
    expect([...schedule.values()].every(date => date.tasks.length > 0)).toBe(true)
    expect([...schedule.values()].some(date => date.tasks.some(task => task.practice))).toBe(true)
  })
  it('anchors all stage boundaries to the original start day', () => {
    expect(addMonths('2026-01-31', 2)).toBe('2026-03-31')
    expect(getPlanStage('2026-01-31', '2026-03-30')?.month).toBe(2)
    expect(getPlanStage('2026-01-31', '2026-03-31')?.month).toBe(3)
  })
  it('bounds AI changes to the selected week and accepts portable plan settings', () => {
    const result = { explanation: '调整时长', changes: [{ date: day, day: { ...defaultDay, minutes: 45 } }] }
    expect(parseProposal(result, day)).toEqual(result)
    expect(parseProposal({ ...result, changes: [{ date: '2026-11-28', day: defaultDay }] }, day)).toBeNull()
    expect(parseProposal({ ...result, changes: [{ date: day, day: { ...defaultDay, minutes: -1 } }] }, day)).toBeNull()
    expect(importMobilePlan(JSON.stringify({
      format: 'studypilot-backup', version: 1, settings: { startDate: day, weekdayMinutes: 60, weekendMinutes: 120 },
      dayModes: [{ date: day, mode: 'BUSY' }],
    }), defaultPlan(day))).toEqual({ startDate: day, weekdayMinutes: 60, weekendMinutes: 120, days: { [day]: { ...defaultDay, mode: 'busy' } } })
  })
})
