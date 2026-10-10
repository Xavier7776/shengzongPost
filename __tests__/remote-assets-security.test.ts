import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { allowedCloudinaryUrl, readRemoteBytes } from '@/lib/security/remote-assets'
import { allowedPetAsset, readPetMetadata } from '@/lib/security/pet-assets'
import { isRasterImage } from '@/lib/security/image'
beforeEach(() => { vi.stubEnv('CLOUDINARY_CLOUD_NAME','test-cloud'); vi.stubGlobal('fetch',vi.fn()) })
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals() })
describe('public PDF and privileged external assets', () => {
  it('refuses local IPs, other clouds, deceptive hosts and unsafe pet paths before fetching', async () => {
    for (const url of ['http://127.0.0.1/a','https://res.cloudinary.com.evil.test/test-cloud/raw/upload/a','https://res.cloudinary.com/other/raw/upload/a']) expect(allowedCloudinaryUrl(url)).toBeNull()
    for (const url of ['https://codex-pets.net.evil.test/assets/pets/a.webp','https://codex-pets.net@127.0.0.1/a.webp','https://codex-pets.net/assets/pets/%2e%2e/private.webp','http://codex-pets.net/assets/pets/a.webp']) expect(allowedPetAsset(url)).toBe(false)
    await expect(readPetMetadata('https://127.0.0.1/api/pets')).rejects.toThrow('Untrusted')
    expect(fetch).not.toHaveBeenCalled()
    expect(allowedPetAsset('https://codex-pets.net/assets/pets/v/123/test-pet/spritesheet.webp')).toBe(true)
  })
  it('rejects redirects and bounds chunked downloads without Content-Length', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(null,{status:302,headers:{Location:'http://127.0.0.1'}}))
    await expect(readRemoteBytes('https://codex-pets.net/assets/pets/a.webp',8)).rejects.toThrow('unavailable')
    const stream = new ReadableStream<Uint8Array>({start(c){c.enqueue(new Uint8Array(6));c.enqueue(new Uint8Array(6));c.close()}})
    vi.mocked(fetch).mockResolvedValue(new Response(stream))
    await expect(readRemoteBytes('https://codex-pets.net/assets/pets/a.webp',8)).rejects.toThrow('too large')
    expect(vi.mocked(fetch)).toHaveBeenLastCalledWith(expect.any(String),expect.objectContaining({redirect:'manual',signal:expect.any(AbortSignal)}))
  })
  it('allows supported raster signatures while refusing mislabeled HTML/SVG', () => {
    for (const bytes of [new Uint8Array([137,80,78,71,13,10,26,10]),new Uint8Array([255,216,255]),new TextEncoder().encode('GIF89a'),new TextEncoder().encode('RIFF0000WEBP')]) expect(isRasterImage(bytes)).toBe(true)
    for (const bytes of [new TextEncoder().encode('<svg onload="bad()">'),new TextEncoder().encode('<html>'),new Uint8Array()]) expect(isRasterImage(bytes)).toBe(false)
  })
})
