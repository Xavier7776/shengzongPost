// lib/db/_core.ts
// Neon sql with cold-start retry + row serializers. Shared by all domain modules.

import { neon } from '@neondatabase/serverless'

if (!process.env.DATABASE_URL) throw new Error('Missing DATABASE_URL')

// Neon 免费版计算节点空闲后会挂起，首次请求冷启动期间可能 fetch failed
// 用重试 wrapper 覆盖冷启动窗口（最多 3 次，间隔递增）
// 注意：不设置 fetchOptions.cache —— no-store 会触发 Next 的 DYNAMIC_SERVER_USAGE，
// 导致 ISR 页面（首页/work/projects）在构建期静态导出失败；与 db-skills.ts 保持一致
const rawSql = neon(process.env.DATABASE_URL)

async function withRetry<T>(fn: () => Promise<T>, retries = 3): Promise<T> {
  let lastErr: unknown
  for (let i = 0; i < retries; i++) {
    try {
      return await fn()
    } catch (err) {
      // 只对网络层错误重试（fetch failed / network error）
      if (err instanceof TypeError || (err as { message?: string })?.message?.includes('fetch failed')) {
        lastErr = err
        // 首次重试等 500ms，之后递增
        if (i < retries - 1) await new Promise(r => setTimeout(r, 500 * (i + 1)))
        continue
      }
      throw err
    }
  }
  throw lastErr
}

// 导出带重试的 sql 函数，签名兼容原始 neon sql tagged template
export const sql = new Proxy(rawSql, {
  apply(_target, _thisArg, args) {
    return withRetry(() => Reflect.apply(rawSql, _thisArg, args))
  },
}) as typeof rawSql

// ─── serializer ───────────────────────────────────────────────────────────────
export function serializeRow(row: Record<string, unknown>): Record<string, unknown> {
  const r: Record<string, unknown> = {}
  for (const k of Object.keys(row))
    r[k] = row[k] instanceof Date ? (row[k] as Date).toISOString() : row[k]
  return r
}
export function serializeRows(rows: Record<string, unknown>[]) { return rows.map(serializeRow) }
