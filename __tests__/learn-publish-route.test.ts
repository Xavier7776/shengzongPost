import { createHmac } from 'node:crypto'
import { NextRequest } from 'next/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { makeEdition } from './fixtures/learn-edition'
const { publish } = vi.hoisted(() => ({ publish: vi.fn() }))
vi.mock('@/lib/learn/publish', () => ({ publishEdition: publish }))
import { POST } from '@/app/api/internal/learn/publish/route'

const secret = 'test-only-learn-secret-32-characters-long'
function request(body: string, timestamp = '1791419400', signature?: string) {
  return new NextRequest('https://site.test/api/internal/learn/publish', {
    method: 'POST', body, headers: {
      'x-learn-timestamp': timestamp,
      'x-learn-signature': signature ?? createHmac('sha256', secret).update(timestamp + '.' + body).digest('hex'),
    },
  })
}
beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-10-08T00:30:00Z'))
  vi.stubEnv('LEARN_PUBLISH_SECRET', secret)
  publish.mockReset().mockResolvedValue({ created: true, slug: 'daily-learn-2026-10-08' })
})
afterEach(() => { vi.useRealTimers(); vi.unstubAllEnvs() })

describe('learn publication authorization and input boundaries', () => {
  it('fails closed without a publishing secret', async () => {
    vi.stubEnv('LEARN_PUBLISH_SECRET', '')
    expect((await POST(request('{}'))).status).toBe(503)
    expect(publish).not.toHaveBeenCalled()
  })
  it('rejects invalid and expired signatures without publishing', async () => {
    expect((await POST(request('{}', undefined, '0'.repeat(64)))).status).toBe(401)
    expect((await POST(request('{}', '1791419000'))).status).toBe(401)
    expect(publish).not.toHaveBeenCalled()
  })
  it('limits streamed bodies without trusting Content-Length', async () => {
    expect((await POST(request('x'.repeat(180001)))).status).toBe(413)
    expect(publish).not.toHaveBeenCalled()
  })
  it('rejects malformed, invalid and previous-day editions', async () => {
    expect((await POST(request('{'))).status).toBe(400)
    expect((await POST(request('{}'))).status).toBe(422)
    expect((await POST(request(JSON.stringify(makeEdition('2026-10-07'))))).status).toBe(409)
    expect(publish).not.toHaveBeenCalled()
  })
  it('publishes only validated signed content and reports idempotent retries', async () => {
    const edition = makeEdition()
    expect((await POST(request(JSON.stringify(edition)))).status).toBe(201)
    expect(publish).toHaveBeenCalledWith(edition)
    publish.mockResolvedValue({ created: false, slug: 'daily-learn-2026-10-08' })
    expect((await POST(request(JSON.stringify(edition)))).status).toBe(200)
  })
})
