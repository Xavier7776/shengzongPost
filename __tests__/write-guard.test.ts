// @vitest-environment node
import { NextRequest } from 'next/server'
import { describe, expect, it, vi } from 'vitest'
import { withWriteGuard } from '@/lib/security/write-guard'

const request = (body: BodyInit | null = '{}', headers: HeadersInit = {}) => new NextRequest('https://blog.test/api/write', {
  method: 'POST', body, headers, duplex: 'half', signal: new AbortController().signal,
} as RequestInit & { signal: AbortSignal })
describe('custom API trust boundary', () => {
  it('rejects hostile Origin, null origin and missing cookie origin before running a handler', async () => {
    const handler = vi.fn(async () => Response.json({ ok: true }))
    const route = withWriteGuard(handler)
    const hostile: Record<string, string>[] = [{ origin: 'https://evil.test' }, { origin: 'null' }, { 'sec-fetch-site': 'cross-site' }, { cookie: 'session=opaque' }]
    for (const headers of hostile) {
      expect((await route(request('{}', headers))).status).toBe(403)
    }
    expect(handler).not.toHaveBeenCalled()
    expect((await route(request('{}', { origin: 'https://blog.test', cookie: 'session=opaque' }))).status).toBe(200)
    expect((await route(request('{}', { referer: 'https://blog.test/page', cookie: 'session=opaque' }))).status).toBe(200)
    // Explicit API-key/server clients have no browser cookie or Origin; authentication remains the handler's job.
    expect((await route(request('{}', { 'x-admin-api-key': 'test-only' }))).status).toBe(200)
    const loopback = new NextRequest('http://127.0.0.1:3323/api/write', { method: 'POST', headers: { host: '127.0.0.1:3323', origin: 'http://127.0.0.1:3323', cookie: 'session=opaque' }, body: '{}' })
    expect((await route(loopback)).status).toBe(200)
    expect((await route(request('{}', { host: 'blog.test', origin: 'https://evil.test', 'x-forwarded-host': 'evil.test' }))).status).toBe(403)
    expect((await route(request('{}', { host: 'blog.test@evil.test', origin: 'https://blog.test' }))).status).toBe(403)
  })
  it('bounds the actual stream when Content-Length is absent or understated, including caught parser errors', async () => {
    const route = withWriteGuard(async req => {
      try { await req.json(); return Response.json({ ok: true }) }
      catch { return Response.json({ error: 'old catch' }, { status: 500 }) }
    }, { maxBytes: 12 })
    expect((await route(request('{"x":"abcdefghijk"}', { 'content-length': '2' }))).status).toBe(413)
    expect((await route(request('{"x":"abcdefghijk"}'))).status).toBe(413)
    expect((await route(request('{}', { 'content-length': '99' }))).status).toBe(413)
    expect((await route(request('{}'))).status).toBe(200)
  })
  it('returns 400 for malformed or non-object JSON even when a handler catches it', async () => {
    const route = withWriteGuard(async req => { await req.json().catch(() => ({})); return Response.json({ ok: true }) })
    for (const body of ['{', 'null', '[]', '"text"']) expect((await route(request(body))).status).toBe(400)
  })
  it('does not read an unauthenticated upload; preserves multipart file bytes and contextual arguments', async () => {
    let pulls = 0
    const stream = new ReadableStream({ pull(controller) { pulls++; controller.enqueue(new Uint8Array(100)); controller.close() } }, { highWaterMark: 0 })
    expect((await withWriteGuard(async () => Response.json({}, { status: 401 }))(request(stream))).status).toBe(401)
    expect(pulls).toBe(0)
    const multipart = '--test\r\nContent-Disposition: form-data; name="file"; filename="test.md"\r\nContent-Type: text/markdown\r\n\r\nreal bytes\r\n--test--\r\n'
    const route = withWriteGuard(async (req, ctx: { params: { id: string } }) => {
      const file = (await req.formData()).get('file') as File
      return Response.json({ id: ctx.params.id, text: await file.text() })
    })
    expect(await (await route(request(multipart, { 'content-type': 'multipart/form-data; boundary=test' }), { params: { id: '7' } })).json()).toEqual({ id: '7', text: 'real bytes' })
  })
})
