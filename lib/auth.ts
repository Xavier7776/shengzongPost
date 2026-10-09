// lib/auth.ts
import { timingSafeEqual } from 'node:crypto'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { getUserRoleById } from '@/lib/db'
import { redirect } from 'next/navigation'
import { cookies, headers } from 'next/headers'

// This bypass is strictly confined to local development; production cannot opt into it.
function isDevBypass() {
  return process.env.NODE_ENV === 'development' && cookies().get('dev-admin-bypass')?.value === '1'
}

function apiKeyMatches(actual: string | null): boolean {
  const expected = process.env.ADMIN_API_KEY
  if (!expected || !actual) return false
  const expectedBuffer = Buffer.from(expected, 'utf8')
  const actualBuffer = Buffer.from(actual, 'utf8')
  return expectedBuffer.length === actualBuffer.length && timingSafeEqual(expectedBuffer, actualBuffer)
}

/** Require a signed admin session AND the current database role.
 * Role revocation must take effect on the next request rather than waiting for JWT expiry.
 */
async function activeAdminSession() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return null
  const user = session.user as { id?: string | number; role?: string }
  const id = Number(user.id)
  if (user.role !== 'admin' || !Number.isSafeInteger(id) || id <= 0) return null
  if (await getUserRoleById(id) !== 'admin') return null
  return session
}

/** Used by server components; unauthenticated and non-admin sessions are redirected. */
export async function requireAdmin() {
  if (isDevBypass()) return { user: { name: 'Dev', email: 'dev@local', role: 'admin' } }
  const session = await activeAdminSession()
  if (!session) redirect('/admin/login')
  return session
}

/** Used by privileged route handlers. A separately configured admin API key is preserved. */
export async function requireAdminApi() {
  // Only the explicit server-side API key may bypass a browser user session.
  if (apiKeyMatches(headers().get('x-admin-api-key'))) {
    return { user: { name: 'Admin API', email: 'admin@zshengzong.top', role: 'admin' } }
  }
  if (isDevBypass()) return { user: { name: 'Dev', email: 'dev@local', role: 'admin' } }
  return activeAdminSession()
}
