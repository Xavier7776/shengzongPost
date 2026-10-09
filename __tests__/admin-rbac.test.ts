import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
const { session, dbRole, header, cookie, redirect } = vi.hoisted(() => ({
  session: vi.fn(), dbRole: vi.fn(), header: vi.fn(), cookie: vi.fn(), redirect: vi.fn(),
}))
vi.mock('next-auth', () => ({ getServerSession: session }))
vi.mock('@/lib/authOptions', () => ({ authOptions: {} }))
vi.mock('@/lib/db', () => ({ getUserRoleById: dbRole }))
vi.mock('next/headers', () => ({
  headers: () => ({ get: header }), cookies: () => ({ get: cookie }),
}))
vi.mock('next/navigation', () => ({ redirect: (url: string) => {
  redirect(url)
  throw new Error('NEXT_REDIRECT')
} }))
import { requireAdmin, requireAdminApi } from '@/lib/auth'

beforeEach(() => {
  session.mockReset()
  dbRole.mockReset()
  header.mockReset()
  cookie.mockReset()
  redirect.mockReset()
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
})
