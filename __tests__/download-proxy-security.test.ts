import { NextRequest } from 'next/server'
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import { GET } from '@/app/api/download/route'

const request = (source: string, name = 'file.pdf') =>
  new NextRequest('https://www.zshengzong.top/api/download?url=' +
    encodeURIComponent(source) + '&filename=' + encodeURIComponent(name))

beforeEach(() => {
  vi.stubEnv('CLOUDINARY_CLOUD_NAME', 'portfolio-demo')
  vi.stubGlobal('fetch', vi.fn())
})
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals() })

describe('Cloudinary-only attachment download proxy', () => {
  it('refuses HTTP, credentials, lookalike hostnames and other Cloudinary accounts', async () => {
    const invalid = [
      'http://res.cloudinary.com/portfolio-demo/raw/upload/test.pdf',
      'https://res.cloudinary.com.evil.test/portfolio-demo/raw/upload/test.pdf',
      'https://evilcloudinary.com/portfolio-demo/raw/upload/test.pdf',
      'https://user:pass@res.cloudinary.com/portfolio-demo/raw/upload/test.pdf',
      'https://res.cloudinary.com/another-account/raw/upload/test.pdf',
      'https://res.cloudinary.com/portfolio-demo/raw/private/test.pdf',
      'https://res.cloudinary.com/portfolio-demo/raw/upload/test.pdf#ignore',
    ]
    for (const url of invalid) expect((await GET(request(url))).status).toBe(403)
    expect(fetch).not.toHaveBeenCalled()
  })
  it('refuses unconfigured installations, without upstream requests', async () => {
    vi.stubEnv('CLOUDINARY_CLOUD_NAME', '')
    expect((await GET(request('https://res.cloudinary.com/portfolio-demo/raw/upload/test.pdf'))).status).toBe(503)
    expect(fetch).not.toHaveBeenCalled()
  })
  it('streams only HTTPS same-cloud content with fixed request redirect policy', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(new Uint8Array([1,2,3]), {
      status: 200, headers: { 'Content-Length': '3' },
    }))
    const url='https://res.cloudinary.com/portfolio-demo/raw/upload/v2/test.pdf'
    const response = await GET(request(url, '说明书.pdf'))
    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toBe('application/pdf')
    expect(response.headers.get('content-disposition')).toContain('attachment;')
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(new Uint8Array([1,2,3]))
    expect(vi.mocked(fetch)).toHaveBeenCalledWith(url,expect.objectContaining({ redirect:'manual' }))
  })
  it('rejects redirects without following them, even to a second HTTPS host', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(null, {
      status: 302, headers: { Location: 'https://evil.test/secret' },
    }))
    const response = await GET(request('https://res.cloudinary.com/portfolio-demo/raw/upload/test.md'))
    expect(response.status).toBe(502)
    expect(fetch).toHaveBeenCalledTimes(1)
  })
  it('rejects responses that advertise oversize data', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(new Uint8Array([1]), {
      status: 200, headers: { 'Content-Length': String(65*1024*1024) },
    }))
    expect((await GET(request('https://res.cloudinary.com/portfolio-demo/raw/upload/test.bin'))).status).toBe(413)
  })
  it('limits streamed data when upstream omits Content-Length', async () => {
    const chunk = new Uint8Array(33*1024*1024)
    const upstream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(chunk)
        controller.enqueue(chunk)
        controller.close()
      },
    })
    vi.mocked(fetch).mockResolvedValue(new Response(upstream, { status: 200 }))
    const response = await GET(request('https://res.cloudinary.com/portfolio-demo/raw/upload/big.bin'))
    expect(response.status).toBe(200)
    await expect(response.arrayBuffer()).rejects.toThrow(/limit/)
  })
})
