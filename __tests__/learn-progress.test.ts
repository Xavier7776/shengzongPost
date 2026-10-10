// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { learningState, parseLearningProgress, serializeLearningProgress, selfTestPassed, type LearningProgress } from '@/lib/learn/progress'
const record: LearningProgress = { slug: 'daily-learn-2026-10-09', title: 'Progress fixture', fingerprint: 'a'.repeat(64), state: 'in_progress', answers: {}, practiceDone: false, position: 500, section: '方法', updatedAt: 1000, completedAt: null }
describe('local learning progress contract', () => {
  it.each([null, '', '{broken', 'null', '{"version":2,"records":[]}', '{"version":1,"records":{}}'])('survives unavailable or corrupt data: %s', raw => expect(parseLearningProgress(raw)).toEqual({}))
  it('retains the newest duplicate, caps capacity, and round-trips learning positions and answers', () => {
    const records = Array.from({ length: 120 }, (_, i) => ({ ...record, slug: `daily-learn-2026-${String(Math.floor(i / 28) + 1).padStart(2, '0')}-${String(i % 28 + 1).padStart(2, '0')}`, updatedAt: i + 1 }))
    records.push(record, { ...record, answers: { '18': 0 }, updatedAt: 2000 })
    const stored = parseLearningProgress(JSON.stringify({ version: 1, records }))
    expect(Object.keys(stored)).toHaveLength(100)
    expect(stored[record.slug].answers).toEqual({ '18': 0 })
    expect(parseLearningProgress(serializeLearningProgress(stored))).toEqual(stored)
  })
  it.each([{ fingerprint: 'bad' }, { slug: '//example.com' }, { position: -1 }, { position: null }, { answers: { '__proto__': 1, '0': 20 } }, { state: 'completed', completedAt: 1000, practiceDone: false }, { state: 'completed', completedAt: null, practiceDone: true }])('discards an invalid entry without losing valid ones: %j', change => {
    expect(parseLearningProgress(JSON.stringify({ version: 1, records: [{ ...record, ...change }, record] }))).toEqual({ [record.slug]: record })
  })
  it('requires every current answer plus explicit practice and completion, with cancellation possible', () => {
    const correct = { '18': 0, '19': 1 }
    expect(selfTestPassed({ '18': 0 }, correct)).toBe(false)
    expect(selfTestPassed({ '18': 0, '19': 0 }, correct)).toBe(false)
    expect(selfTestPassed({ '18': 0, '19': 1 }, correct)).toBe(true)
    expect(selfTestPassed({}, {})).toBe(false)
    expect(learningState(false, true, 1000)).toBe('in_progress')
    expect(learningState(true, false, 1000)).toBe('practice_done')
    expect(learningState(true, true, null)).toBe('practice_done')
    expect(learningState(true, true, 1000)).toBe('completed')
    expect(learningState(true, false, null)).toBe('practice_done')
  })
})
