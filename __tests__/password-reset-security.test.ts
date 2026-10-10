import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'
const { authAllowed, userByEmail, userByToken, updatePassword, send } = vi.hoisted(() => ({
  authAllowed: vi.fn(), userByEmail: vi.fn(), userByToken: vi.fn(), updatePassword: vi.fn(), send: vi.fn(),
}))
vi.mock('@/lib/auth-rate-limit', () => ({
  MIN_PASSWORD_LENGTH: 12,
  normalizeEmail: (raw: unknown) => typeof raw === 'string' && raw.includes('@') ? raw.trim().toLowerCase() : null,
  validNewPassword: (v: unknown) => typeof v === 'string' && v.length >= 12,
  allowAuthAttempt: authAllowed,
}))
vi.mock('@/lib/db', () => ({
  getUserByEmail: userByEmail, setVerifyToken: vi.fn(),
  getUserByVerifyTokenAndEmail: userByToken, updateUserPassword: updatePassword,
}))
vi.mock('resend', () => ({ Resend: class { emails = { send } } }))
import { PATCH, POST } from '@/app/api/user/forgot-password/route'

function call(method: 'POST' | 'PATCH', data: Record<string, unknown>) {
  return new NextRequest('https://blog.test/api/user/forgot-password', {
    method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
  })
}
beforeEach(() => {
  for (const mock of [authAllowed, userByEmail, userByToken, updatePassword, send]) mock.mockReset()
  authAllowed.mockResolvedValue(true)
  userByEmail.mockResolvedValue(null)
  userByToken.mockResolvedValue(null)
  updatePassword.mockResolvedValue(undefined)
})

describe('password reset control surface', () => {
  it('returns 429 without account lookup when quota exhausted', async () => {
    authAllowed.mockResolvedValue(false)
    const res = await POST(call('POST', { email: 'victim@example.com' }))
    expect(res.status).toBe(429)
    expect(userByEmail).not.toHaveBeenCalled()
  })
  it('does not expose whether the supplied email is registered', async () => {
    const res = await POST(call('POST', { email: 'UNKNOWN@EXAMPLE.COM' }))
    expect(res.status).toBe(200)
    expect((await res.json()).ok).toBe(true)
    expect(userByEmail).toHaveBeenCalledWith('unknown@example.com')
  })
  it('requires sufficiently long passwords before checking a numeric reset code', async () => {
    expect((await PATCH(call('PATCH', { email: 'user@example.com', code: '123456', newPassword: '12345678' }))).status).toBe(400)
    expect(userByToken).not.toHaveBeenCalled()
  })
  it('ties the code lookup to the requested normalized account', async () => {
    const body = { email: 'USER@example.com', code: '123456', newPassword: 'a very strong password' }
    expect((await PATCH(call('PATCH', body))).status).toBe(400)
    expect(userByToken).toHaveBeenCalledWith('123456','user@example.com')
    expect(updatePassword).not.toHaveBeenCalled()
  })
  it('refuses code attempts over quota before the token lookup', async () => {
    authAllowed.mockResolvedValue(false)
    const res = await PATCH(call('PATCH', {email:'user@example.com',code:'123456',newPassword:'a very strong password'}))
    expect(res.status).toBe(429)
    expect(userByToken).not.toHaveBeenCalled()
  })
  it('only reports success after the account-bound token is consumed atomically', async () => {
    userByToken.mockResolvedValue({ id: 7, password: 'previous-password-hash' })
    updatePassword.mockResolvedValue(true)
    const body = { email: 'user@example.com', code: '123456', newPassword: 'a very strong password' }
    const response = await PATCH(call('PATCH', body))
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ ok: true })
    expect(updatePassword).toHaveBeenCalledWith(7, expect.stringMatching(/^\$2[aby]\$/), '123456', 'previous-password-hash')
    updatePassword.mockResolvedValue(false)
    expect((await PATCH(call('PATCH', body))).status).toBe(400)
  })
})
