// lib/rate-limit.ts
// 极简内存限流：滑动窗口计数，单实例有效（serverless 多实例下是尽力而为的威慑，
// 目的是挡住脚本刷量，不是严格计费防护）

const buckets = new Map<string, number[]>()

export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now()
  const hits = (buckets.get(key) ?? []).filter(t => now - t < windowMs)
  if (hits.length >= limit) {
    buckets.set(key, hits)
    return false
  }
  hits.push(now)
  buckets.set(key, hits)
  // 粗清理：桶数量失控时整体重置（低频路径不会触发）
  if (buckets.size > 10_000) buckets.clear()
  return true
}

export function clientIp(req: Request): string {
  return (
    req.headers.get('x-real-ip') ||
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    'unknown'
  )
}
