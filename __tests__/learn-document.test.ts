import { describe, it, expect } from 'vitest'
import { chinaDate, trustedUrl, validateEdition } from '@/lib/learn/document'
describe('daily learn publication gates', () => {
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
