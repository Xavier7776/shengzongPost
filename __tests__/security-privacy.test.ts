// @vitest-environment node
import { NextRequest } from 'next/server'
import { afterEach, expect, it, vi } from 'vitest'
const { send, quota } = vi.hoisted(() => ({ send: vi.fn(), quota: vi.fn(() => true) }))
vi.mock('resend', () => ({ Resend: class { emails = { send } } }))
vi.mock('@/lib/rate-limit', () => ({ rateLimit: quota, clientIp: () => '127.0.0.1' }))
import { sendVerificationEmail } from '@/lib/email'
import { logFailure } from '@/lib/security/log'
import { POST } from '@/app/api/security/csp-report/route'
afterEach(() => { vi.restoreAllMocks(); send.mockReset(); quota.mockReturnValue(true) })
it('escapes email display names and prevents token attribute injection', async () => {
  send.mockResolvedValue({ error: null })
  await sendVerificationEmail('test@example.com', '<img src=x onerror=alert(1)>', '" onclick="evil')
  const html = send.mock.calls[0][0].html
  expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;')
  expect(html).toContain('token=%22%20onclick%3D%22evil')
  expect(html).not.toContain('<img')
  send.mockResolvedValue({ error: { message: 'private-provider-secret' } })
  await expect(sendVerificationEmail('test@example.com', 'User', 'token')).rejects.toThrow('Verification email delivery failed')
})
it('logs only correlation metadata and whitelisted database codes', () => {
  const log = vi.spyOn(console, 'error').mockImplementation(() => {})
  logFailure('test-scope', { code: '23505', message: 'password=secret', query: 'private SQL' })
  expect(log).toHaveBeenCalledWith('[operation failed]', { scope: 'test-scope', requestId: expect.any(String), code: '23505' })
  logFailure('test-scope', { code: 'private-user-input', message: 'private-token' })
  expect(JSON.stringify(log.mock.calls)).not.toMatch(/secret|private/)
})
it('CSP reports retain only directive and scheme, with bounded anonymous input', async () => {
  const log = vi.spyOn(console, 'info').mockImplementation(() => {})
  const request = (body: string) => new NextRequest('https://blog.test/api/security/csp-report', { method: 'POST', headers: { Origin: 'https://blog.test' }, body })
  const report = { 'csp-report': { 'effective-directive': 'script-src', 'blocked-uri': 'https://private.example/secret?token=private', 'document-uri': 'https://blog.test/profile?email=private', 'script-sample': 'private' } }
  expect((await POST(request(JSON.stringify(report)))).status).toBe(204)
  expect(log).toHaveBeenCalledExactlyOnceWith('[csp report-only]', { directive: 'script-src', scheme: 'https' })
  expect(JSON.stringify(log.mock.calls)).not.toContain('private')
  expect((await POST(request('x'.repeat(33000)))).status).toBe(413)
  quota.mockReturnValue(false)
  expect((await POST(request(JSON.stringify(report)))).status).toBe(204)
  expect(log).toHaveBeenCalledTimes(1)
})
