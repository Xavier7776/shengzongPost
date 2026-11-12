import { createHash, randomUUID } from 'node:crypto'
import sharp from 'sharp'
import { assetBranch, assetRepository } from '@/lib/asset-config'

export interface UploadResult {
  secure_url: string
  public_id: string
  width?: number
  height?: number
}

export interface AssetUploadOptions {
  folder?: string
  public_id?: string
  resource_type?: 'raw' | 'image' | 'video' | 'auto'
  overwrite?: boolean
  timeout?: number
  transformation?: { width?: number; height?: number; crop?: string; gravity?: string }[]
}

const MAX_BYTES = 16 * 1024 * 1024
const SHA = /^[a-f0-9]{40}$/
const PATH = /^uploads\/(?:[A-Za-z0-9_-]+\/)*[A-Za-z0-9_.-]+$/

function token(): string {
  const value = process.env.GITHUB_ASSET_TOKEN?.trim() || process.env.GITHUB_TOKEN?.trim()
  if (!value) throw new Error('Missing GITHUB_ASSET_TOKEN: repository Contents write access is required')
  return value
}

async function github(path: string, init: RequestInit, timeout = 60_000): Promise<Response> {
  return fetch(`https://api.github.com/repos/${assetRepository()}/${path}`, {
    ...init,
    redirect: 'error',
    cache: 'no-store',
    signal: AbortSignal.timeout(Math.min(Math.max(timeout, 100), 60_000)),
    headers: { Accept: 'application/vnd.github+json', Authorization: `Bearer ${token()}`,
      'X-GitHub-Api-Version': '2026-03-10', 'User-Agent': 'MindStack-Asset-Storage', 'Content-Type': 'application/json', ...init.headers },
  })
}

function contentPath(path: string): string {
  return 'contents/' + path.split('/').map(encodeURIComponent).join('/')
}

/** Append-only objects; a lost response is never retried as a second write. */
export async function uploadGitHubAsset(buffer: Buffer, options: AssetUploadOptions): Promise<UploadResult> {
  if (!buffer.length || buffer.length > MAX_BYTES) throw new Error('Asset must be between 1 byte and 16 MiB')
  token()
  const branch = assetBranch()
  const repository = assetRepository()
  const folder = (options.folder || 'images').replace(/^\/+|\/+$/g, '')
  if (!/^[A-Za-z0-9_-]+(?:\/[A-Za-z0-9_-]+)*$/.test(folder)) throw new Error('Invalid asset folder')
  const requestedName = options.public_id?.split('/').at(-1) || randomUUID()
  if (!/^[A-Za-z0-9_-][A-Za-z0-9_.-]{0,180}$/.test(requestedName) || requestedName.includes('..')) throw new Error('Invalid asset filename')
  let bytes = buffer
  let width: number | undefined
  let height: number | undefined
  let extension: string
  if (options.resource_type === 'raw') {
    extension = /\.(md|pdf|txt|json)$/i.exec(requestedName)?.[1].toLowerCase() || 'bin'
  } else {
    const metadata = await sharp(buffer, { limitInputPixels: 64_000_000, animated: true }).metadata()
    if (!metadata.format || !['jpeg', 'png', 'webp', 'gif'].includes(metadata.format)) throw new Error('Unsupported image format')
    extension = metadata.format === 'jpeg' ? 'jpg' : metadata.format
    width = metadata.width
    height = metadata.pageHeight || metadata.height
    const resize = options.transformation?.[0]
    if (resize?.width && resize?.height) {
      const result = await sharp(buffer, { limitInputPixels: 64_000_000 }).rotate()
        .resize(resize.width, resize.height, { fit: 'cover', position: 'attention' }).toBuffer({ resolveWithObject: true })
      bytes = result.data
      width = result.info.width
      height = result.info.height
    }
  }
  const stem = requestedName.replace(/\.[A-Za-z0-9]+$/, '')
  // Unique paths and content digests avoid replacing an object referenced by an older post.
  const digest = createHash('sha256').update(bytes).digest('hex').slice(0, 12)
  const path = `uploads/${folder}/${stem}-${randomUUID()}-${digest}.${extension}`
  const response = await github(contentPath(path), { method: 'PUT', body: JSON.stringify({
    message: `Store blog asset ${path} [skip ci]`, branch, content: bytes.toString('base64'),
  }) }, options.timeout)
  if (!response.ok) throw new Error(`GitHub asset upload failed (${response.status})`)
  const result = await response.json()
  if (!SHA.test(result.commit?.sha ?? '') || !SHA.test(result.content?.sha ?? '') || result.content?.path !== path) {
    throw new Error('GitHub asset upload returned an invalid result')
  }
  return { secure_url: `https://raw.githubusercontent.com/${repository}/${result.commit.sha}/${path}`,
    public_id: `github:${repository}:${path}`, width, height }
}

/** Remove the branch entry; Git history and previously pinned URLs remain available. */
export async function deleteGitHubAsset(publicId: string): Promise<void> {
  // Historical provider IDs must never become GitHub paths or trigger external deletions.
  if (!publicId.startsWith('github:')) return
  const repository = assetRepository()
  const prefix = `github:${repository}:`
  if (!publicId.startsWith(prefix)) throw new Error('Foreign GitHub asset ID')
  const path = publicId.slice(prefix.length)
  if (!PATH.test(path) || path.includes('..')) throw new Error('Invalid GitHub asset ID')
  const branch = assetBranch()
  const metadata = await github(`${contentPath(path)}?ref=${encodeURIComponent(branch)}`, { method: 'GET' })
  if (metadata.status === 404) return
  if (!metadata.ok) throw new Error(`GitHub asset lookup failed (${metadata.status})`)
  const content = await metadata.json()
  if (content.type !== 'file' || content.path !== path || !SHA.test(content.sha ?? '')) throw new Error('Invalid GitHub asset metadata')
  const response = await github(contentPath(path), { method: 'DELETE', body: JSON.stringify({
    message: `Remove blog asset ${path} [skip ci]`, branch, sha: content.sha,
  }) })
  if (!response.ok) throw new Error(`GitHub asset removal failed (${response.status})`)
}
