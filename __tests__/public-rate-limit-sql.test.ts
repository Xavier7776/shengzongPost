// @vitest-environment node
import { PGlite } from '@electric-sql/pglite'
import { afterAll, beforeAll, beforeEach, expect, it, vi } from 'vitest'
import { writeFileSync } from 'node:fs'
const { sql } = vi.hoisted(() => ({ sql: vi.fn() }))
vi.mock('@/lib/db/_core', () => ({ sql }))
import { allowAuthAttempt } from '@/lib/auth-rate-limit'
const db = new PGlite()
const capture: { query: string; params: unknown[] }[] = []
beforeAll(async () => { await db.exec('CREATE TABLE auth_rate_limits(scope text,subject_hash text,window_started_at timestamptz,hit_count int,PRIMARY KEY(scope,subject_hash))') })
beforeEach(async () => {
  vi.stubEnv('AUTH_RATE_LIMIT_SECRET', 'synthetic-secret')
  await db.exec('TRUNCATE auth_rate_limits')
  sql.mockImplementation(async (strings: TemplateStringsArray, ...params: unknown[]) => {
    const query = strings.reduce((s, part, i) => s + part + (i < params.length ? '$' + (i + 1) : ''), '')
    if (!capture.length) capture.push({ query, params })
    return (await db.query(query, params)).rows
  })
})
afterAll(async () => {
  if (process.env.M10_RATE_SQL_CAPTURE) writeFileSync(process.env.M10_RATE_SQL_CAPTURE, JSON.stringify(capture))
  vi.unstubAllEnvs(); await db.close()
})
const request = new Request('https://blog.test/api/newsletter', { headers: { 'x-real-ip': '203.0.113.7' } })
it('executes the real UPSERT, caps IP spraying, and resets expired windows', async () => {
  for (let i=0; i<5; i++) expect(await allowAuthAttempt(request, 'newsletter', `person${i}@test.invalid`)).toBe(true)
  expect(await allowAuthAttempt(request, 'newsletter', 'next@test.invalid')).toBe(false)
  await db.exec("UPDATE auth_rate_limits SET window_started_at=NOW()-INTERVAL '61 seconds'")
  expect(await allowAuthAttempt(request, 'newsletter', 'next@test.invalid')).toBe(true)
  const count = await db.query<{ hit_count: number }>("SELECT hit_count FROM auth_rate_limits WHERE scope='newsletter.ip'")
  expect(count.rows[0].hit_count).toBe(1)
})
it('shares one counter across simultaneous helper calls and blocks when storage is unavailable', async () => {
  const allowed = await Promise.all(Array.from({ length: 12 }, () => allowAuthAttempt(request, 'gallery-like', '203.0.113.7')))
  expect(allowed.filter(Boolean)).toHaveLength(10)
  sql.mockRejectedValue(new Error('DB unavailable'))
  await expect(allowAuthAttempt(request, 'analytics', 'visitor')).rejects.toThrow('DB unavailable')
})
