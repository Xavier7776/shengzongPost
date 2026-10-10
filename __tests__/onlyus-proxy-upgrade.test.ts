// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
const mocks = vi.hoisted(() => ({ client: vi.fn(), user: vi.fn() }))
vi.mock('@supabase/ssr', () => ({ createServerClient: mocks.client }))
import { config, proxy } from '@/proxy'
import { COOKIE_NAME, signGateToken } from '@/features/onlyus/lib/gate'

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubEnv('ONLYUS_GATE_SECRET', 'synthetic-onlyus-upgrade-secret')
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co')
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'synthetic-onlyus-anon')
  mocks.user.mockResolvedValue({ data: { user: null }, error: null })
  mocks.client.mockImplementation((_url, _key, options) => {
    options.cookies.setAll([{ name: 'sb-synthetic-session', value: 'refreshed', options: { httpOnly: true, path: '/' } }])
    return { auth: { getUser: mocks.user } }
  })
})
afterEach(() => vi.unstubAllEnvs())
describe('OnlyUs Next proxy preserves gate and session refresh', () => {
  it('keeps the OnlyUs matcher, denies missing/invalid gates and retains the destination', async () => {
    expect(config.matcher).toEqual(['/onlyus/:path*'])
    for (const cookie of ['', `${COOKIE_NAME}=invalid`]) {
      const response = await proxy(new NextRequest('https://example.invalid/onlyus/tools/movies?private=1', { headers: { cookie } }))
      expect(response.status).toBe(307)
      expect(response.headers.get('location')).toBe('https://example.invalid/onlyus/gate?from=%2Fonlyus%2Ftools%2Fmovies')
    }
    expect(mocks.user).toHaveBeenCalledTimes(2)
  })
  it('accepts a real signed gate and preserves refreshed cookies on the response', async () => {
    const token = await signGateToken()
    const response = await proxy(new NextRequest('https://example.invalid/onlyus/tools/movies', { headers: { cookie: `${COOKIE_NAME}=${token}` } }))
    expect(response.status).toBe(200)
    expect(response.headers.get('x-middleware-next')).toBe('1')
    expect(response.cookies.get('sb-synthetic-session')?.value).toBe('refreshed')
    const gate = await proxy(new NextRequest('https://example.invalid/onlyus/gate'))
    expect(gate.status).toBe(200)
    expect(gate.headers.has('location')).toBe(false)
  })
})
