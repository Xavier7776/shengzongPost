// @vitest-environment node
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import sharp from 'sharp'
import { uploadLarge } from '@/lib/uploadLarge'
import { deleteGitHubAsset } from '@/lib/github-assets'
import { allowedGitHubAssetUrl } from '@/lib/security/remote-assets'

const commit = 'a'.repeat(40)
const blob = 'b'.repeat(40)
const repository = 'Xavier7776/shengzongPost'
const branch = 'assets/daily-learn-covers-20261111'
const raw = `https://raw.githubusercontent.com/${repository}/${commit}/`

beforeEach(() => {
  vi.stubEnv('GITHUB_ASSET_TOKEN', 'synthetic-token')
  vi.stubEnv('GITHUB_ASSET_REPOSITORY', repository)
  vi.stubEnv('GITHUB_ASSET_BRANCH', branch)
  vi.stubGlobal('fetch', vi.fn(async (url: string) => {
    const path = new URL(url).pathname.split('/contents/')[1]
    return Response.json({ commit: { sha: commit }, content: { sha: blob, path } }, { status: 201 })
  }))
})
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals() })

it('uploads original 6 MiB bytes once, pins the commit instead of the blob/branch, and preserves raw extensions', async () => {
  const bytes = Buffer.alloc(6 * 1024 * 1024, 42)
  const result = await uploadLarge(bytes, { resource_type: 'raw', folder: 'attachments', public_id: 'manual.md' })
  expect(result.secure_url).toMatch(new RegExp(`^${raw}uploads/attachments/manual-[a-f0-9-]+\\.md$`))
  expect(result.public_id).toBe(`github:${repository}:` + result.secure_url.slice(raw.length))
  expect(fetch).toHaveBeenCalledOnce()
  const [url, init] = vi.mocked(fetch).mock.calls[0]
  expect(String(url)).toBe('https://api.github.com/repos/' + repository + '/contents/' + result.secure_url.slice(raw.length))
  const request = init as RequestInit
  expect(request.redirect).toBe('error')
  expect(request.headers).toMatchObject({ Authorization: 'Bearer synthetic-token' })
  const body = JSON.parse(String(request.body))
  expect(body.branch).toBe(branch)
  expect(body.sha).toBeUndefined()
  expect(Buffer.from(body.content, 'base64').equals(bytes)).toBe(true)
  expect(allowedGitHubAssetUrl(result.secure_url)).not.toBeNull()
})

it('keeps sprite geometry and bytes intact, and reports real image dimensions', async () => {
  const bytes = await sharp({ create: { width: 16, height: 8, channels: 4, background: '#123456' } }).png().toBuffer()
  const result = await uploadLarge(bytes, { resource_type: 'image', folder: 'sprites' })
  expect(result).toMatchObject({ width: 16, height: 8 })
  const body = JSON.parse(String((vi.mocked(fetch).mock.calls[0][1] as RequestInit).body))
  expect(Buffer.from(body.content, 'base64')).toEqual(bytes)
  expect(result.secure_url).toMatch(/\.png$/)
})

it('performs avatar resizing locally before storing the result', async () => {
  const bytes = await sharp({ create: { width: 400, height: 300, channels: 3, background: '#123456' } }).png().toBuffer()
  const result = await uploadLarge(bytes, { resource_type: 'image', transformation: [{ width: 200, height: 200 }] })
  expect(result).toMatchObject({ width: 200, height: 200 })
  const body = JSON.parse(String((vi.mocked(fetch).mock.calls[0][1] as RequestInit).body))
  expect(await sharp(Buffer.from(body.content, 'base64')).metadata()).toMatchObject({ width: 200, height: 200 })
})

it('refuses unsafe paths, SVG uploads, empty/oversized data, and code branches before writing', async () => {
  for (const options of [{ folder: '../src' }, { public_id: '..bad' }]) {
    await expect(uploadLarge(Buffer.from('x'), { resource_type: 'raw', ...options })).rejects.toThrow('Invalid')
  }
  await expect(uploadLarge(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"/>'), { resource_type: 'image' })).rejects.toThrow('Unsupported')
  await expect(uploadLarge(Buffer.alloc(0), {})).rejects.toThrow('16 MiB')
  await expect(uploadLarge(Buffer.alloc(16 * 1024 * 1024 + 1), {})).rejects.toThrow('16 MiB')
  vi.stubEnv('GITHUB_ASSET_BRANCH', 'main')
  await expect(uploadLarge(Buffer.from('x'), { resource_type: 'raw' })).rejects.toThrow('assets/')
  expect(fetch).not.toHaveBeenCalled()
})

it('requires upload credentials without exposing them or attempting unauthenticated writes', async () => {
  vi.stubEnv('GITHUB_ASSET_TOKEN', '')
  vi.stubEnv('GITHUB_TOKEN', '')
  await expect(uploadLarge(Buffer.from('x'), { resource_type: 'raw' })).rejects.toThrow('Missing GITHUB_ASSET_TOKEN')
  expect(fetch).not.toHaveBeenCalled()
})

it('does not repeat ambiguous writes on provider failures', async () => {
  vi.mocked(fetch).mockResolvedValue(new Response(null, { status: 429 }))
  await expect(uploadLarge(Buffer.from('x'), { resource_type: 'raw' })).rejects.toThrow('(429)')
  expect(fetch).toHaveBeenCalledOnce()
})

it.each([{ commit: { sha: 'main' } }, { commit: { sha: commit }, content: { sha: blob, path: 'other/path.png' } }])('refuses malformed success responses', async response => {
  vi.mocked(fetch).mockResolvedValue(Response.json(response, { status: 201 }))
  await expect(uploadLarge(Buffer.from('x'), { resource_type: 'raw' })).rejects.toThrow('invalid result')
})

it('deletes only validated entries from the asset branch using the current blob SHA', async () => {
  const path = 'uploads/attachments/manual.md'
  vi.mocked(fetch).mockResolvedValueOnce(Response.json({ type: 'file', path, sha: blob })).mockResolvedValueOnce(Response.json({}))
  await deleteGitHubAsset(`github:${repository}:${path}`)
  const [url, init] = vi.mocked(fetch).mock.calls[1]
  expect(String(url)).toContain('/contents/' + path)
  expect(init?.method).toBe('DELETE')
  expect(JSON.parse(String(init?.body))).toMatchObject({ branch, sha: blob })
})

it('preserves historical provider objects and refuses foreign or non-upload GitHub objects', async () => {
  await deleteGitHubAsset('arc-portfolio/old-image')
  for (const id of [`github:other/repo:uploads/x.png`, `github:${repository}:package.json`, `github:${repository}:uploads/../package.json`]) {
    await expect(deleteGitHubAsset(id)).rejects.toThrow()
  }
  expect(fetch).not.toHaveBeenCalled()
})

it.each([
  'http://raw.githubusercontent.com/' + repository + '/' + commit + '/uploads/x.png',
  'https://raw.githubusercontent.com.evil.test/' + repository + '/' + commit + '/uploads/x.png',
  'https://raw.githubusercontent.com/other/repo/' + commit + '/uploads/x.png',
  'https://raw.githubusercontent.com/' + repository + '/main/uploads/x.png',
  raw + 'package.json', raw + 'uploads/x.png#fragment', raw + 'uploads/%2Fsecret.png',
])('rejects unsafe or mutable GitHub download sources: %s', url => {
  expect(allowedGitHubAssetUrl(url)).toBeNull()
})
