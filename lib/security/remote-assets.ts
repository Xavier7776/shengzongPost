export function allowedCloudinaryUrl(input: string): URL | null {
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

/** Callers must validate a fixed HTTPS origin before this read; redirects are never followed. */
export async function readRemoteBytes(url: string, maxBytes: number): Promise<Uint8Array> {
  const response = await fetch(url, { redirect: 'manual', cache: 'no-store', signal: AbortSignal.timeout(20_000) })
  if (!response.ok || !response.body) throw new Error('Remote asset unavailable')
  if (Number(response.headers.get('content-length')) > maxBytes) {
    await response.body.cancel()
    throw new Error('Remote asset too large')
  }
  const reader = response.body.getReader(), chunks: Uint8Array[] = []
  let size = 0
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      size += value.byteLength
      if (size > maxBytes) throw new Error('Remote asset too large')
      chunks.push(value)
    }
  } finally { await reader.cancel() }
  const bytes = new Uint8Array(size)
  let offset = 0
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length }
  return bytes
}

