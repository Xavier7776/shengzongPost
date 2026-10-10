// @vitest-environment node
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { PassThrough } from 'node:stream'
const mock = vi.hoisted(() => ({ upload: vi.fn() }))
vi.mock('@/lib/cloudinary', () => ({ cloudinary: { uploader: { upload_stream: mock.upload } } }))
import { uploadLarge } from '@/lib/uploadLarge'
beforeEach(() => { mock.upload.mockReset(); vi.stubEnv('CLOUDINARY_CLOUD_NAME', 'test') })
afterEach(() => vi.unstubAllEnvs())
const result = { secure_url: 'https://res.cloudinary.com/test/raw/upload/document.pdf', public_id: 'document.pdf' }
it('streams the original bytes once and preserves raw filenames', async () => {
  const bytes = Buffer.alloc(6 * 1024 * 1024, 42)
  let received = Buffer.alloc(0)
  mock.upload.mockImplementation((options, callback) => {
    expect(options).toEqual({ timeout: 60_000, resource_type: 'raw', public_id: 'document.pdf' })
    const stream = new PassThrough()
    stream.on('data', chunk => { received = Buffer.concat([received, chunk]) })
    stream.on('finish', () => { callback(null, result); callback(new Error('late response')) })
    return stream
  })
  expect(await uploadLarge(bytes, { resource_type: 'raw', public_id: 'document.pdf' })).toEqual(result)
  expect(received.equals(bytes)).toBe(true)
  expect(mock.upload).toHaveBeenCalledTimes(1)
})
it.each(['throw', 'stream', 'callback'])('fails on %s errors without retrying an ambiguous upload', async kind => {
  mock.upload.mockImplementation((_options, callback) => {
    if (kind === 'throw') throw new Error('provider unavailable')
    const stream = new PassThrough()
    stream.resume()
    queueMicrotask(() => kind === 'stream' ? stream.emit('error', new Error('provider unavailable')) : callback(new Error('provider unavailable')))
    return stream
  })
  await expect(uploadLarge(Buffer.from('test'), {})).rejects.toThrow('provider unavailable')
  expect(mock.upload).toHaveBeenCalledTimes(1)
})
it.each([undefined, { ...result, public_id: '' }, { ...result, public_id: {} }, { ...result, secure_url: 'https://evil.test/file' }, { ...result, secure_url: 'https://res.cloudinary.com/other/image/upload/x' }])('rejects incomplete or foreign provider responses', async value => {
  mock.upload.mockImplementation((_options, callback) => { const stream = new PassThrough(); stream.resume(); queueMicrotask(() => callback(null, value)); return stream })
  await expect(uploadLarge(Buffer.from('test'), {})).rejects.toThrow('invalid result')
})
