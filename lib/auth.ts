// lib/auth.ts
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { redirect } from 'next/navigation'

/** 在 Server Component 或 Route Handler 里调用，未登录则跳转 */
export async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/admin/login')
  return session
}

/** 在 Route Handler 里调用，未登录则返回 401 */
export async function requireAdminApi() {
  const session = await getServerSession(authOptions)
  if (!session) return null
  return session
}
