import { describe, it, expect } from 'vitest'
import { chinaDate, trustedUrl, validateEdition } from '@/lib/learn/document'
import { makeEdition } from './fixtures/learn-edition'
describe('daily learn publication gates', () => {
  it('accepts a complete sourced edition', () => {
    expect(validateEdition(makeEdition())).toMatchObject({ ok: true, errors: [] })
  })
  it('rejects impossible dates, inherited topic names, future sources and invalid citations', () => {
    expect(validateEdition({ ...makeEdition(), date: '2026-02-31' }).errors).toContain('invalid date')
    expect(validateEdition({ ...makeEdition(), topic: 'toString' }).errors).toContain('invalid topic')
    const future = makeEdition()
    future.sources[0].publishedAt = '2026-10-09T00:00:00Z'
    expect(validateEdition(future).ok).toBe(false)
    const uncited = makeEdition()
    uncited.blocks.push({ type: 'paragraph', text: '技术分析与工程取舍。'.repeat(20), sourceIds: ['missing'] })
    expect(validateEdition(uncited).ok).toBe(false)
  })
  it('recognizes canonical primary-source pages only', () => {
    expect(trustedUrl('https://arxiv.org/abs/2609.00123','arxiv')).toBe(true)
    expect(trustedUrl('http://arxiv.org/abs/2609.00123','arxiv')).toBe(false)
    expect(trustedUrl('https://arxiv.org.evil.com/abs/2609.00123','arxiv')).toBe(false)
    expect(trustedUrl('https://github.com/o/r/releases/tag/v1','github_release')).toBe(true)
    expect(trustedUrl('https://github.com/o/r/pull/1','github_release')).toBe(false)
  })
  it('rejects empty and unverifiable generated articles', () => {
    expect(validateEdition({}).ok).toBe(false)
    expect(validateEdition({version:1,sources:[{id:'s1',url:'https://evil.com',excerpt:'fake'}]}).errors.length).toBeGreaterThan(0)
  })
  it('reports China-local date', () => {
    expect(chinaDate(new Date('2026-10-08T00:45:00Z'))).toBe('2026-10-08')
    expect(chinaDate(new Date('2026-10-07T23:45:00Z'))).toBe('2026-10-08')
  })
})
