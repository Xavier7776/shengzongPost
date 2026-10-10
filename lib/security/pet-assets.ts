import { readRemoteBytes } from './remote-assets'

export function allowedPetAsset(input: string): boolean {
  try {
    const url = new URL(input)
    return url.protocol === 'https:' && url.hostname === 'codex-pets.net' && !url.port &&
      !url.username && !url.password && !url.hash && /^\/assets\/pets\/[a-zA-Z0-9/_-]+\.(webp|png|gif)$/.test(url.pathname)
  } catch { return false }
}

export async function readPetMetadata(url: string) {
  const target = new URL(url)
  if (target.origin !== 'https://codex-pets.net' || target.username || target.password || target.hash ||
      !/^\/api\/pets(?:\/[a-zA-Z0-9_-]{1,100})?$/.test(target.pathname)) throw new Error('Untrusted pet metadata')
  return JSON.parse(new TextDecoder().decode(await readRemoteBytes(target.href, 2 * 1024 * 1024)))
}
