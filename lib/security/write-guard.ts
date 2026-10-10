import { NextRequest } from 'next/server'
import { logFailure } from './log'

const failure = (status: number, error: string) => Response.json({ error }, { status })

/** Guard custom writes; NextAuth retains its own CSRF protocol and signed publishing retains HMAC. */
export function withWriteGuard<Args extends unknown[]>(
  handler: (request: NextRequest, ...args: Args) => Promise<Response>,
  { maxBytes = 4 * 1024 * 1024, sameOrigin = true } = {},
) {
  return async (request: NextRequest, ...args: Args): Promise<Response> => {
    if (sameOrigin) {
      const origin = request.headers.get('origin'), referer = request.headers.get('referer')
      const site = request.headers.get('sec-fetch-site')
      try {
        const source = origin ?? (referer ? new URL(referer).origin : null)
        let target = new URL(request.url)
        const host = request.headers.get('host')
        // NextURL normalizes loopback IPs; browsers send the actual origin in Host.
        if (host) {
          if (/[\s/@\\?#]/.test(host)) return failure(403, '请求来源无效')
          target = new URL(target.protocol + '//' + host)
        }
        if (site === 'cross-site' || (source !== null && source !== target.origin) ||
            (request.headers.has('cookie') && source === null && site !== 'same-origin')) {
          return failure(403, '跨站写入请求被拒绝')
        }
      } catch { return failure(403, '请求来源无效') }
    }
    const length = request.headers.get('content-length')
    if (length !== null && (!/^\d+$/.test(length) || Number(length) > maxBytes)) {
      return failure(413, '请求体过大或长度无效')
    }
    let bodyFailure: Response | null = null
    const reader = request.body?.getReader()
    let received = 0
    const body = reader ? new ReadableStream<Uint8Array>({
      async pull(controller) {
        try {
          const { done, value } = await reader.read()
          if (done) { controller.close(); return }
          received += value.byteLength
          if (received > maxBytes) {
            bodyFailure = failure(413, '请求体过大')
            void reader.cancel().catch(() => {})
            controller.error(new Error('Request body limit exceeded'))
          } else controller.enqueue(value)
        } catch (error) { controller.error(error) }
      },
      cancel(reason) { return reader.cancel(reason) },
    }, { highWaterMark: 0 }) : null
    const guarded = new NextRequest(request.url, {
      method: request.method, headers: request.headers, body, signal: request.signal, duplex: 'half',
    } as RequestInit & { signal: AbortSignal })
    const json = guarded.json.bind(guarded)
    guarded.json = async () => {
      try {
        const value = await json()
        if (!value || typeof value !== 'object' || Array.isArray(value)) throw new SyntaxError('Expected JSON object')
        return value
      } catch (error) {
        bodyFailure ??= failure(400, '无效的 JSON 对象')
        throw error
      }
    }
    const formData = guarded.formData.bind(guarded)
    guarded.formData = async () => {
      try { return await formData() }
      catch (error) { bodyFailure ??= failure(400, '无效的上传表单'); throw error }
    }
    try {
      const response = await handler(guarded, ...args)
      return bodyFailure ?? response
    } catch (error) {
      if (!bodyFailure) logFailure('write-request', error)
      return bodyFailure ?? failure(500, '请求暂不可用，请稍后重试')
    } finally {
      // Authentication can reject before consuming an upload; release that stream without buffering it.
      if (reader) void reader.cancel().catch(() => {})
    }
  }
}
