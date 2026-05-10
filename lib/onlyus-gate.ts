// lib/onlyus-gate.ts
// 使用 Web Crypto API（Edge Runtime 原生支持，无需额外依赖）

const COOKIE_NAME = 'onlyus-gate'
const ALG = { name: 'HMAC', hash: 'SHA-256' }
const EXPIRY_SECONDS = 60 * 60 * 24 * 7 // 7 天

function getSecretBytes(): Uint8Array {
  const s = process.env.ONLYUS_GATE_SECRET
  if (!s) throw new Error('ONLYUS_GATE_SECRET is not set')
  return new TextEncoder().encode(s)
}

async function getCryptoKey(usage: KeyUsage[]): Promise<CryptoKey> {
  return crypto.subtle.importKey('raw', getSecretBytes() as unknown as BufferSource, ALG, false, usage)
}

/** 签发 token：base64url(payload).base64url(signature) */
export async function signGateToken(): Promise<string> {
  const payload = JSON.stringify({
    granted: true,
    exp: Math.floor(Date.now() / 1000) + EXPIRY_SECONDS,
  })
  const payloadB64 = btoa(payload).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
  const key = await getCryptoKey(['sign'])
  const sig = await crypto.subtle.sign(ALG, key, new TextEncoder().encode(payloadB64))
  const sigB64 = btoa(String.fromCharCode(...Array.from(new Uint8Array(sig))))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
  return `${payloadB64}.${sigB64}`
}

/** 验证 token：校验签名 + 过期时间 */
export async function verifyGateToken(token: string): Promise<boolean> {
  try {
    const [payloadB64, sigB64] = token.split('.')
    if (!payloadB64 || !sigB64) return false

    // 验签
    const key = await getCryptoKey(['verify'])
    const sigBytes = Uint8Array.from(atob(sigB64.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0))
    const valid = await crypto.subtle.verify(ALG, key, sigBytes, new TextEncoder().encode(payloadB64))
    if (!valid) return false

    // 检查过期
    const payload = JSON.parse(atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/')))
    if (!payload.granted) return false
    if (payload.exp < Math.floor(Date.now() / 1000)) return false

    return true
  } catch {
    return false
  }
}

export { COOKIE_NAME }