import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
const { session, dbRole, header, cookie, redirect, sql, invalidate } = vi.hoisted(() => ({
  session: vi.fn(), dbRole: vi.fn(), header: vi.fn(), cookie: vi.fn(), redirect: vi.fn(),
  sql: vi.fn(), invalidate: vi.fn(),
}))
vi.mock('next-auth', () => ({ getServerSession: session }))
vi.mock('@/lib/authOptions', () => ({ authOptions: {} }))
vi.mock('@/lib/db', () => ({ getUserRoleById: dbRole, sql }))
vi.mock('next/cache', () => ({ revalidatePath: invalidate }))
vi.mock('next/headers', () => ({
  headers: () => ({ get: header }), cookies: () => ({ get: cookie }),
}))
vi.mock('next/navigation', () => ({ redirect: (url: string) => {
  redirect(url)
  throw new Error('NEXT_REDIRECT')
} }))
import { requireAdmin, requireAdminApi } from '@/lib/auth'
import { POST as batchPost } from '@/app/api/posts/batch/route'

beforeEach(() => {
  session.mockReset()
  dbRole.mockReset()
  header.mockReset()
  cookie.mockReset()
  redirect.mockReset()
  sql.mockReset().mockResolvedValue([{ slug: 'test-only-post' }])
  invalidate.mockReset()
  cookie.mockReturnValue(undefined)
  header.mockReturnValue(null)
  session.mockResolvedValue({ user: { id: '7', role: 'admin', name: 'Admin' } })
  dbRole.mockResolvedValue('admin')
  vi.stubEnv('NODE_ENV', 'production')
  vi.stubEnv('ADMIN_API_KEY', '')
})
afterEach(() => vi.unstubAllEnvs())

describe('central admin authorization', () => {
  it('rejects anonymous, ordinary and stale-session admin users', async () => {
    session.mockResolvedValueOnce(null)
    expect(await requireAdminApi()).toBeNull()
    session.mockResolvedValueOnce({ user: { id: '4', role: 'user' } })
    expect(await requireAdminApi()).toBeNull()
    expect(dbRole).not.toHaveBeenCalled()

    dbRole.mockResolvedValueOnce('user')
    expect(await requireAdminApi()).toBeNull()
    expect(dbRole).toHaveBeenCalledWith(7)
  })
  it('rejects a missing, nonnumeric or invalid DB account identity', async () => {
    session.mockResolvedValueOnce({ user: { role: 'admin' } })
    expect(await requireAdminApi()).toBeNull()
    session.mockResolvedValueOnce({ user: { id: 'abc', role: 'admin' } })
    expect(await requireAdminApi()).toBeNull()
    session.mockResolvedValueOnce({ user: { id: '-1', role: 'admin' } })
    expect(await requireAdminApi()).toBeNull()
    expect(dbRole).not.toHaveBeenCalled()
  })
  it('accepts only an admin JWT backed by an active admin role', async () => {
    expect((await requireAdminApi())?.user).toMatchObject({ role: 'admin' })
    expect(dbRole).toHaveBeenCalledWith(7)
  })
  it('does not allow a non-admin into server-rendered admin screens', async () => {
    dbRole.mockResolvedValue('payMember')
    await expect(requireAdmin()).rejects.toThrow('NEXT_REDIRECT')
    expect(redirect).toHaveBeenCalledWith('/admin/login')
  })
  it('keeps the explicit admin API key for batch tools, but rejects invalid keys', async () => {
    vi.stubEnv('ADMIN_API_KEY', 'super-secret-for-batch-tools')
    header.mockImplementation((key: string) => key === 'x-admin-api-key' ? 'super-secret-for-batch-tools' : null)
    expect((await requireAdminApi())?.user).toMatchObject({ role: 'admin' })
    expect(session).not.toHaveBeenCalled()
    header.mockReturnValue('incorrect')
    session.mockResolvedValueOnce(null)
    expect(await requireAdminApi()).toBeNull()
  })
  it('does not trust a dev bypass cookie in production', async () => {
    cookie.mockReturnValue({ value: '1' })
    session.mockResolvedValue(null)
    expect(await requireAdminApi()).toBeNull()
  })
  it.each([
    ['anonymous', null, null, null, 403],
    ['ordinary user', { user: { id: '7', role: 'user' } }, 'user', null, 403],
    ['active admin', { user: { id: '7', role: 'admin' } }, 'admin', null, 200],
    ['revoked admin JWT', { user: { id: '7', role: 'admin' } }, 'user', null, 403],
    ['explicit API key', null, null, 'fixture-batch-key', 200],
    ['invalid API key', null, null, 'incorrect-key', 403],
  ])('enforces %s at the actual batch publishing route', async (_, actor, role, key, status) => {
    session.mockResolvedValue(actor)
    dbRole.mockResolvedValue(role)
    vi.stubEnv('ADMIN_API_KEY', 'fixture-batch-key')
    header.mockImplementation((name: string) => name === 'x-admin-api-key' ? key : null)
    const response = await batchPost(new NextRequest('http://localhost/api/posts/batch', {
      method: 'POST', body: JSON.stringify({ action: 'publish', slugs: ['test-only-post'] }),
    }))
    expect(response.status).toBe(status)
    if (status === 200) {
      expect(await response.json()).toMatchObject({ ok: true, count: 1 })
      expect(sql).toHaveBeenCalledTimes(1)
      expect(invalidate).toHaveBeenCalledWith('/blog/test-only-post')
    } else {
      expect(sql).not.toHaveBeenCalled()
      expect(invalidate).not.toHaveBeenCalled()
    }
  })
})
