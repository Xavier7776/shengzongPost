import { describe, expect, it } from 'vitest'
import { canonicalEdition, editionFingerprint, textVersion } from '@/lib/learn/publication-contract'
import { makeEdition } from './fixtures/learn-edition'

describe('canonical edition identity', () => {
  it('ignores object key order but preserves nested values and array order', () => {
    const original = makeEdition()
    const reordered = JSON.parse(JSON.stringify(original, (_,value) => value && typeof value==='object' && !Array.isArray(value)
      ? Object.fromEntries(Object.entries(value).reverse()) : value))
    expect(editionFingerprint(reordered)).toBe(editionFingerprint(original))
    expect(JSON.parse(canonicalEdition(original))).toEqual(original)
    expect(editionFingerprint({...original,takeaways:[...original.takeaways].reverse()})).not.toBe(editionFingerprint(original))
    expect(editionFingerprint({...original,careerTip:original.careerTip+' 修改'})).not.toBe(editionFingerprint(original))
    expect(editionFingerprint(original)).toMatch(/^[a-f0-9]{64}$/)
  })
  it('retains the exact legacy textVersion including Unicode and code newlines', () => {
    const edition = makeEdition()
    expect(textVersion(edition)).toContain('步骤 1: ')
    expect(textVersion(edition)).toContain('example data\nexample data')
    expect(textVersion(edition)).toContain('https://arxiv.org/abs/2610.00001')
    expect(textVersion(JSON.parse(canonicalEdition(edition)))).toBe(textVersion(edition))
  })
})
