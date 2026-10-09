// Proxy only this site's uploaded Cloudinary assets.
// The previous hostname.endsWith('cloudinary.com') accepted lookalike attacker domains,
// HTTP and redirected responses; this route is intentionally fail-closed.
import { NextRequest } from 'next/server'

export const runtime = 'edge'
const MAX_DOWNLOAD_BYTES = 64 * 1024 * 1024
const DOWNLOAD_TIMEOUT_MS = 60_000

function contentType(filename: string) {
  if (/\.md$/i.test(filename)) return 'text/markdown; charset=utf-8'
  if (/\.pdf$/i.test(filename)) return 'application/pdf'
  return 'application/octet-stream'
}

function allowedCloudinaryUrl(input: string): URL | null {
  try {
    const target = new URL(input)
    const cloud = process.env.CLOUDINARY_CLOUD_NAME?.trim()
    if (!cloud || !/^[a-zA-Z0-9_-]{1,100}$/.test(cloud)) return null
    if (target.protocol !== 'https:' || target.hostname !== 'res.cloudinary.com' ||
        target.port || target.username || target.password || target.hash) return null
    const match = /^\/([a-zA-Z0-9_-]+)\/(raw|image|video)\/upload\/(.+)$/.exec(target.pathname)
    if (!match || match[1] !== cloud || match[3].length > 1800) return null
    return target
  } catch { return null }
}

/** Limit downloaded bytes even when Cloudinary does not provide a Content-Length header. */
function boundedBody(body: ReadableStream<Uint8Array>): ReadableStream<Uint8Array> {
  const reader = body.getReader()
  let received = 0
  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      try {
        const { done, value } = await reader.read()
        if (done) { controller.close(); return }
        received += value.byteLength
        if (received > MAX_DOWNLOAD_BYTES) {
          await reader.cancel('download exceeds configured limit')
          controller.error(new Error('download exceeds configured limit'))
          return
        }
        controller.enqueue(value)
      } catch (error) { controller.error(error) }
    },
    async cancel(reason) { await reader.cancel(reason) },
  })
}

export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get('url')
  if (!raw) return Response.json({ error: '缺少 url 参数' }, { status: 400 })
  if (!process.env.CLOUDINARY_CLOUD_NAME) {
    return Response.json({ error: '下载服务暂不可用' }, { status: 503 })
  }
  const target = allowedCloudinaryUrl(raw)
  if (!target) return Response.json({ error: '只允许本站 Cloudinary HTTPS 附件' }, { status: 403 })
  const requestedName = req.nextUrl.searchParams.get('filename') ?? 'attachment'
  const filename = requestedName.slice(0, 180).replace(/[\r\n]/g, '').trim() || 'attachment'

  try {
    // redirect:manual is deliberate: never follow a trusted host to an unchecked host/IP.
    const upstream = await fetch(target.href, {
      redirect: 'manual',
      signal: AbortSignal.timeout(DOWNLOAD_TIMEOUT_MS),
      headers: { 'Accept': 'application/octet-stream,*/*;q=0.8' },
    })
    if (!upstream.ok || !upstream.body) {
      return Response.json({ error: '附件获取失败或重定向被拒绝' }, { status: 502 })
    }
    const size = Number(upstream.headers.get('content-length'))
    if (Number.isFinite(size) && size > MAX_DOWNLOAD_BYTES) {
      await upstream.body.cancel()
      return Response.json({ error: '文件不能超过 64MB' }, { status: 413 })
    }
    return new Response(boundedBody(upstream.body), {
      status: 200,
      headers: {
        'Content-Type': contentType(filename),
        'Content-Disposition': 'attachment; filename*=UTF-8' + String.fromCharCode(39,39) + encodeURIComponent(filename),
        'Cache-Control': 'private, max-age=3600',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch (error) {
    console.error('[download proxy]', error)
    return Response.json({ error: '下载失败' }, { status: 502 })
  }
}
