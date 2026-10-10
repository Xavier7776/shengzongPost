// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { latency, relevance } from '../scripts/search-metrics'
import suite from './fixtures/search-relevance-queries.json'
import type { SearchResponse } from '../lib/search'

const response = (ids: string[]) => ({ results: ids.map(id => ({ type: 'post', id })) }) as SearchResponse
const judged = { id: 'example', q: 'example', category: 'retrieval', relevant: [{ key: 'post:a', grade: 3 }, { key: 'post:b', grade: 1 }] }

describe('search benchmark measurements', () => {
  it('counts known-pool recall and rank discounts rather than title hits', () => {
    const result = relevance(judged, response(['unjudged', 'b', 'a']))
    expect(result.recall20).toBe(1)
    expect(result.mrr10).toBe(.5)
    expect(result.ndcg10).toBeCloseTo((1 / Math.log2(3) + 7 / Math.log2(4)) / (7 + 1 / Math.log2(3)))
    const late = relevance(judged, response([...Array.from({ length: 10 }, (_, i) => `unjudged-${i}`), 'a']))
    expect(late).toEqual({ recall20: .5, mrr10: 0, ndcg10: 0 })
  })
  it('excludes unjudged diagnostics and rejects corrupt judgments or duplicate results', () => {
    expect(relevance({ ...judged, relevant: [] }, response([]))).toEqual({ recall20: null, mrr10: null, ndcg10: null })
    expect(() => relevance(judged, response(['a', 'a']))).toThrow('Duplicate')
    expect(() => relevance({ ...judged, relevant: [...judged.relevant, judged.relevant[0]] }, response([]))).toThrow('Invalid')
    expect(() => relevance({ ...judged, relevant: [{ key: 'post:a', grade: 4 }] }, response([]))).toThrow('Invalid')
  })
  it('uses nearest-rank percentiles with explicit empty and invalid samples', () => {
    expect(latency(Array.from({ length: 100 }, (_, i) => 100 - i))).toEqual({ samples: 100, p50: 50, p95: 95, p99: 99 })
    expect(latency([])).toEqual({ samples: 0, p50: null, p95: null, p99: null })
    expect(() => latency([NaN])).toThrow('Invalid')
  })
  it('keeps a reviewed real-query pool distinct from its diagnostic cases', () => {
    expect(suite.queries.filter(q => q.relevant.length > 0).length).toBeGreaterThanOrEqual(30)
    expect(new Set(suite.queries.map(q => q.id)).size).toBe(suite.queries.length)
    expect(new Set(suite.queries.flatMap(q => q.expectedTypes))).toEqual(new Set(['post', 'skill', 'gallery']))
    expect(suite.queries.every(q => q.expectedTop3.length <= 3)).toBe(true)
    for (const q of suite.queries) expect(new Set(q.relevant.map(r => r.key)).size).toBe(q.relevant.length)
  })
})
