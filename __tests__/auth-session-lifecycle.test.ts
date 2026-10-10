import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { JWT } from 'next-auth/jwt'
const { byEmail, byId } = vi.hoisted(() => ({ byEmail: vi.fn(), byId: vi.fn() }))
vi.mock('@/lib/db', () => ({ getUserByEmail: byEmail, getUserById: byId }))
vi.mock('@/lib/auth-rate-limit', () => ({ normalizeEmail: (v: unknown) => typeof v === 'string' ? v.trim().toLowerCase() : null, allowAuthAttempt: vi.fn() }))
import { authOptions } from '@/lib/authOptions'
const jwt = authOptions.callbacks!.jwt!
const user = { id: 7, email: 'admin@example.com', role: 'admin', password: 'test-bcrypt-hash' }
const run = (token: JWT, extra: Record<string, unknown> = {}) => jwt({ token, ...extra } as Parameters<typeof jwt>[0])
beforeEach(() => { vi.stubEnv('NEXTAUTH_SECRET','test-only-session-key'); byEmail.mockReset().mockResolvedValue(user); byId.mockReset().mockResolvedValue(user) })
afterEach(() => vi.unstubAllEnvs())
describe('JWT account and password lifecycle', () => {
  it('maps GitHub IDs to the authorized real admin, rejecting an absent or ordinary database account', async () => {
    const token = await run({ sub: '987654321', email: user.email }, { user: { id: '987654321' }, account: { provider: 'github' } })
    expect(token.dbId).toBe('7'); expect(token.sub).toBe('7'); expect(token.role).toBe('admin')
    byEmail.mockResolvedValue({ ...user, role: 'user' })
    expect(await run({ email: user.email }, { account: { provider: 'github' } })).toEqual({})
    byEmail.mockResolvedValue(null)
    expect(await run({ email: user.email }, { account: { provider: 'github' } })).toEqual({})
  })
  it('rejects a different account, immediately reflects role revocation and revokes stamped sessions after password change', async () => {
    const token = await run({ email: user.email }, { user: { id: '7' } })
    expect(token.passwordStamp).toMatch(/^[a-f0-9]{64}$/)
    byId.mockResolvedValue({ ...user, role: 'user' })
    expect((await run({ ...token })).role).toBe('user')
    expect(await run({ ...token, email: 'another@example.com' })).toEqual({})
    byId.mockResolvedValue({ ...user, password: 'changed-hash' })
    expect(await run({ ...token })).toEqual({})
  })
  it('does not mint a password stamp for an unversioned legacy JWT or accept unsafe session-update images', async () => {
    const token = await run({ sub: '7', email: user.email, role: 'admin' }, { trigger: 'update', session: { image: 'javascript:alert(1)', role: 'admin', name: 'Updated' } })
    expect(token.passwordStamp).toBeUndefined(); expect(token.picture).toBeUndefined(); expect(token.name).toBe('Updated')
    expect((await authOptions.callbacks!.session!({ session: { user: { email: user.email }, expires: '' }, token: {} } as Parameters<NonNullable<typeof authOptions.callbacks>['session'] & Function>[0])).user).toBeUndefined()
  })
})
