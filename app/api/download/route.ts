// app/api/download/route.ts
// 流式代理下载：直接把 Cloudinary 的响应 body stream 转发给浏览器
// 不缓冲整个文件到内存，绕开 Vercel 4.5MB 响应体限制

import { NextRequest } from 'next/server'

export const runtime = 'edge' // edge runtime 无响应体大小限制

export async function GET(req: NextRequest) {
  const url      = req.nextUrl.searchParams.get('url')
  const filename = req.nextUrl.searchParams.get('filename') ?? 'attachment.pdf'

  if (!url) {
    return new Response(JSON.stringify({ error: '缺少 url 参数' }), { status: 400 })
  }

  let parsed: URL
  try { parsed = new URL(url) } catch {
    return new Response(JSON.stringify({ error: '无效 URL' }), { status: 400 })
  }
  if (!parsed.hostname.endsWith('cloudinary.com')) {
    return new Response(JSON.stringify({ error: '不允许的域名' }), { status: 403 })
  }

  try {
    const upstream = await fetch(url)
    if (!upstream.ok || !upstream.body) {
      return new Response(JSON.stringify({ error: '文件获取失败' }), { status: 502 })
    }

    // 直接把 upstream 的 ReadableStream 转发，不读入内存
    return new Response(upstream.body, {
      status: 200,
      headers: {
        'Content-Type':        'application/pdf',
        'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
        'Cache-Control':       'private, max-age=3600',
      },
    })
  } catch (e) {
    console.error('[download proxy]', e)
    return new Response(JSON.stringify({ error: '下载失败' }), { status: 500 })
  }
}
