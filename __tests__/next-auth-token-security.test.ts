// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { NextRequest } from 'next/server'
import { encode, getToken } from 'next-auth/jwt'

const secret = 'synthetic-next-auth-upgrade-test-only'
describe('NextAuth stable patch with Next request headers and cookies', () => {
  it('rejects malformed Bearer encoding without throwing or authenticating', async () => {
    for (const value of ['%', '%E0%A4%A', '%GG']) {
      const req = new NextRequest('https://example.invalid/api/private', { headers: { authorization: `Bearer ${value}` } })
      await expect(getToken({ req, secret, secureCookie: false })).resolves.toBeNull()
    }
  })
  it('retains signed session identity and rejects a different secret', async () => {
    const token = await encode({ token: { sub: '2', role: 'admin' }, secret })
    const req = new NextRequest('https://example.invalid/api/private', {
      headers: { cookie: `next-auth.session-token=${token}` },
    })
    await expect(getToken({ req, secret, secureCookie: false })).resolves.toMatchObject({ sub: '2', role: 'admin' })
    await expect(getToken({ req, secret: 'different-synthetic-secret', secureCookie: false })).resolves.toBeNull()
  })
})
