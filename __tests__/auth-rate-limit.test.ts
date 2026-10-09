import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
const { query } = vi.hoisted(() => ({ query: vi.fn() }))
vi.mock('@/lib/db/_core', () => ({ sql: query }))
import {
  allowAuthAttempt, normalizeEmail, validNewPassword,
  MIN_PASSWORD_LENGTH, MAX_BCRYPT_UTF8_BYTES,
} from '@/lib/auth-rate-limit'

beforeEach(() => {
  vi.stubEnv('AUTH_RATE_LIMIT_SECRET', 'test-only-secret-never-use-in-production')
  query.mockReset()
  const attempts = new Map<string, number>()
  query.mockImplementation(async (_template: unknown, scope: string, digest: string) => {
    const key = scope + ':' + digest
    const hit = (attempts.get(key) ?? 0) + 1
    attempts.set(key, hit)
    return [{ hit_count: hit }]
  })
})
afterEach(() => vi.unstubAllEnvs())
const request = (ip = '203.0.113.7') =>
  new Request('https://blog.test/api/auth/register', { headers: { 'x-real-ip': ip } })

describe('persistent authentication throttle boundaries', () => {
  it('normalizes emails and accepts long Unicode passphrases', () => {
    expect(normalizeEmail('  USER@EXAMPLE.COM ')).toBe('user@example.com')
    expect(normalizeEmail('not-an-email')).toBeNull()
    expect(MIN_PASSWORD_LENGTH).toBe(12)
    expect(validNewPassword('这是一条足够长的中文安全口令')).toBe(true)
    expect(validNewPassword('abcdefgh')).toBe(false)
    expect(MAX_BCRYPT_UTF8_BYTES).toBe(72)
    expect(validNewPassword('a'.repeat(72))).toBe(true)
    expect(validNewPassword('a'.repeat(73))).toBe(false)
    expect(validNewPassword('中'.repeat(24))).toBe(true)
    expect(validNewPassword('中'.repeat(25))).toBe(false)
  })
  it('limits repeated operations on one email, even across changing client IPs', async () => {
    for (let i = 0; i < 3; i++) {
      expect(await allowAuthAttempt(request('203.0.113.' + (i + 1)), 'registration', 'same@example.com')).toBe(true)
    }
    expect(await allowAuthAttempt(request('203.0.113.9'), 'registration', 'same@example.com')).toBe(false)
    expect(query).toHaveBeenCalledTimes(8)
    const args = query.mock.calls[0]
    expect(args[1]).toBe('registration.account')
    expect(args[2]).toMatch(/^[a-f0-9]{64}$/)
    expect(JSON.stringify(args)).not.toContain('same@example.com')
  })
  it('limits IP spraying across different target email addresses', async () => {
    for (let i=0;i<8;i++) expect(await allowAuthAttempt(request(), 'registration', 'email' + i + '@example.com')).toBe(true)
    expect(await allowAuthAttempt(request(), 'registration', 'email9@example.com')).toBe(false)
  })
  it('fails closed when a secret for hash derivation is unavailable', async () => {
    vi.stubEnv('AUTH_RATE_LIMIT_SECRET', '')
    vi.stubEnv('NEXTAUTH_SECRET', '')
    await expect(allowAuthAttempt(request(), 'login', 'user@example.com')).rejects.toThrow('Auth throttle')
    expect(query).not.toHaveBeenCalled()
  })
})
