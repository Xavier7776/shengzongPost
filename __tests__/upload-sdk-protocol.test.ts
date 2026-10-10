// @vitest-environment node
import { afterAll, beforeAll, expect, it } from 'vitest'
import { createServer, type Server } from 'node:http'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { resolve } from 'node:path'
let server: Server, port: number
const requests: { path: string; bytes: Buffer }[] = []
beforeAll(async () => {
  server = createServer((req, res) => {
    const chunks: Buffer[] = []
    req.on('data', chunk => chunks.push(chunk))
    req.on('end', () => {
      const bytes = Buffer.concat(chunks)
      requests.push({ path: req.url!, bytes })
      res.setHeader('Content-Type', 'application/json')
      if (bytes.includes(Buffer.from('stall_upload'))) return
      if (bytes.includes(Buffer.from('fail_upload'))) { res.statusCode = 500; res.end(JSON.stringify({ error: { message: 'provider failure' } })); return }
      res.end(JSON.stringify({ secure_url: 'https://res.cloudinary.com/ci/raw/upload/document.pdf', public_id: 'document.pdf' }))
    })
  })
  await new Promise<void>(done => server.listen(0, '127.0.0.1', done))
  port = (server.address() as { port: number }).port
})
afterAll(async () => { await new Promise<void>((done, reject) => server.close(error => error ? reject(error) : done())) })
async function upload(publicId: string, timeout = 60_000) {
  return promisify(execFile)(process.execPath, ['--import', 'tsx', '--input-type=module', '-e', `
    import helper from ${JSON.stringify('file:///' + resolve('lib/uploadLarge.ts').replaceAll('\\', '/'))};
    const { uploadLarge } = helper;
    try { console.log(JSON.stringify(await uploadLarge(Buffer.alloc(6*1024*1024,42),{resource_type:'raw',public_id:${JSON.stringify(publicId)},overwrite:false,timeout:${timeout}}))) }
    catch { console.log(JSON.stringify({failed:true})) }
  `], { cwd: process.cwd(), env: { ...process.env, CLOUDINARY_CLOUD_NAME: 'ci', CLOUDINARY_API_KEY: 'synthetic', CLOUDINARY_API_SECRET: 'synthetic', CLOUDINARY_URL: `cloudinary://synthetic:synthetic@ci?upload_prefix=${encodeURIComponent(`http://127.0.0.1:${port}`)}` } })
}
it('uses the installed SDK and real helper to send a 6 MiB multipart raw upload without disk staging', async () => {
  const start = requests.length
  expect(JSON.parse((await upload('document.pdf')).stdout)).toEqual({ secure_url: 'https://res.cloudinary.com/ci/raw/upload/document.pdf', public_id: 'document.pdf' })
  expect(requests).toHaveLength(start + 1)
  expect(requests.at(-1)?.path).toBe('/v1_1/ci/raw/upload')
  expect(requests.at(-1)?.bytes.includes(Buffer.alloc(6 * 1024 * 1024, 42))).toBe(true)
  expect(requests.at(-1)?.bytes.toString('latin1')).toContain('document.pdf')
}, 20_000)
it('makes exactly one provider request on an HTTP failure', async () => {
  const start = requests.length
  expect(JSON.parse((await upload('fail_upload')).stdout)).toEqual({ failed: true })
  expect(requests).toHaveLength(start + 1)
}, 20_000)
it('rejects using the installed SDK socket timeout without issuing a retry', async () => {
  const start = requests.length
  expect(JSON.parse((await upload('stall_upload', 100)).stdout)).toEqual({ failed: true })
  expect(requests).toHaveLength(start + 1)
}, 20_000)
