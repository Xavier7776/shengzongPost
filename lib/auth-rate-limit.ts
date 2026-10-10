import { createHmac } from 'node:crypto'
import { sql } from '@/lib/db/_core'
import { clientIp } from '@/lib/rate-limit'

export const MIN_PASSWORD_LENGTH = 12
export const MAX_PASSWORD_LENGTH = 72
export const MAX_BCRYPT_UTF8_BYTES = 72

/** bcrypt hashes only the first 72 UTF-8 bytes; reject longer passwords rather than silently truncating. */
export const validNewPassword = (password: unknown): password is string =>
  typeof password === 'string' &&
  password.length >= MIN_PASSWORD_LENGTH &&
  password.length <= MAX_PASSWORD_LENGTH &&
  Buffer.byteLength(password, 'utf8') <= MAX_BCRYPT_UTF8_BYTES

export const normalizeEmail = (value: unknown): string | null => {
  if (typeof value !== 'string') return null
  const email = value.trim().toLowerCase()
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) ? email : null
}
export interface RatePolicy {
  identityMax: number
  ipMax: number
  windowSeconds: number
}
export const AUTH_RATE_POLICIES = {
  newsletter: { identityMax: 5, ipMax: 5, windowSeconds: 60 },
  'gallery-like': { identityMax: 10, ipMax: 10, windowSeconds: 60 },
  analytics: { identityMax: 60, ipMax: 120, windowSeconds: 60 },
  'post-view': { identityMax: 60, ipMax: 120, windowSeconds: 60 },
  interaction: { identityMax: 60, ipMax: 120, windowSeconds: 60 },
  contact: { identityMax: 3, ipMax: 8, windowSeconds: 3600 },
  upload: { identityMax: 30, ipMax: 60, windowSeconds: 3600 },
  comment: { identityMax: 10, ipMax: 30, windowSeconds: 600 },
  submission: { identityMax: 5, ipMax: 15, windowSeconds: 3600 },
  login: { identityMax: 12, ipMax: 40, windowSeconds: 900 },
  registration: { identityMax: 3, ipMax: 8, windowSeconds: 3600 },
  'forgot-send': { identityMax: 3, ipMax: 10, windowSeconds: 3600 },
  'forgot-verify': { identityMax: 8, ipMax: 30, windowSeconds: 1800 },
  'password-send': { identityMax: 4, ipMax: 12, windowSeconds: 3600 },
  'password-verify': { identityMax: 8, ipMax: 24, windowSeconds: 1800 },
} satisfies Record<string, RatePolicy>

function identifier(scope: string, value: string): string {
  const secret = process.env.AUTH_RATE_LIMIT_SECRET || process.env.NEXTAUTH_SECRET
  if (!secret) throw new Error('Auth throttle requires NEXTAUTH_SECRET or AUTH_RATE_LIMIT_SECRET')
  return createHmac('sha256', secret).update(scope + '\0' + value).digest('hex')
}

/** Neon INSERT .. ON CONFLICT acts as one atomic counter per identity, across serverless instances. */
async function recordAttempt(scope: string, subject: string, limit: number, periodSeconds: number) {
  const hash = identifier(scope, subject)
  const rows = await sql`INSERT INTO auth_rate_limits (scope,subject_hash,window_started_at,hit_count)
    VALUES (${scope},${hash},NOW(),1)
    ON CONFLICT (scope, subject_hash) DO UPDATE
    SET hit_count = CASE
          WHEN auth_rate_limits.window_started_at <= NOW() - (${periodSeconds}::int * INTERVAL '1 second') THEN 1
          ELSE auth_rate_limits.hit_count + 1 END,
        window_started_at = CASE
          WHEN auth_rate_limits.window_started_at <= NOW() - (${periodSeconds}::int * INTERVAL '1 second') THEN NOW()
          ELSE auth_rate_limits.window_started_at END
    RETURNING hit_count`
  return Number(rows[0]?.hit_count ?? limit + 1) <= limit
}

/** Fail closed if database unavailable. Count attempts before looking up the user account. */
export async function allowAuthAttempt(request: Request, action: keyof typeof AUTH_RATE_POLICIES, identity: string) {
  const { identityMax, ipMax, windowSeconds } = AUTH_RATE_POLICIES[action]
  const ip = clientIp(request)
  const [userAllowed, ipAllowed] = await Promise.all([
    recordAttempt(action + '.account', identity, identityMax, windowSeconds),
    recordAttempt(action + '.ip', ip, ipMax, windowSeconds),
  ])
  return userAllowed && ipAllowed
}
