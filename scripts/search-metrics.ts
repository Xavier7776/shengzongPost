import type { SearchResponse } from '../lib/search'

export interface SearchJudgment {
  id: string
  q: string
  category: string
  relevant: { key: string; grade: number }[]
}

export function relevance(judgment: SearchJudgment, response: SearchResponse) {
  const grades = new Map(judgment.relevant.map(r => [r.key, r.grade]))
  if (grades.size !== judgment.relevant.length || Array.from(grades.values()).some(g => !Number.isInteger(g) || g < 1 || g > 3)) {
    throw new Error('Invalid relevance judgments')
  }
  const keys = response.results.map(r => `${r.type}:${r.id}`)
  if (new Set(keys).size !== keys.length) throw new Error('Duplicate search result')
  const rank = keys.slice(0, 10).findIndex(k => grades.has(k))
  const dcg = (values: number[]) => values.slice(0, 10).reduce((sum, g, i) => sum + (2 ** g - 1) / Math.log2(i + 2), 0)
  const ideal = dcg(Array.from(grades.values()).sort((a, b) => b - a))
  return {
    recall20: grades.size ? keys.slice(0, 20).filter(k => grades.has(k)).length / grades.size : null,
    mrr10: grades.size ? rank < 0 ? 0 : 1 / (rank + 1) : null,
    ndcg10: ideal ? dcg(keys.map(k => grades.get(k) ?? 0)) / ideal : null,
  }
}

// Nearest-rank percentiles include failed-request durations in latency reports.
export function latency(samples: number[]) {
  if (samples.some(n => !Number.isFinite(n) || n < 0)) throw new Error('Invalid latency')
  const ordered = [...samples].sort((a, b) => a - b)
  const percentile = (p: number) => ordered.length ? ordered[Math.ceil(p * ordered.length) - 1] : null
  return { samples: ordered.length, p50: percentile(.5), p95: percentile(.95), p99: percentile(.99) }
}
