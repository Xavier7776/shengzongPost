// __tests__/lib/auth.test.ts
// 测试 lib/auth.ts 中的 requireAdmin / requireAdminApi 逻辑
// 通过 mock next-auth、next/headers、next/navigation 隔离外部依赖
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}))
vi.mock('@/lib/authOptions', () => ({
  authOptions: { name: 'mocked-auth-options' },
}))
vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}))
vi.mock('next/headers', () => ({
  cookies: vi.fn(),
  headers: vi.fn(),
}))

import { requireAdmin, requireAdminApi } from '@/lib/auth'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { cookies, headers } from 'next/headers'

const mockedGetServerSession = vi.mocked(getServerSession)
const mockedRedirect = vi.mocked(redirect)
const mockedCookies = vi.mocked(cookies)
const mockedHeaders = vi.mocked(headers)

describe('认证工具函数 lib/auth', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    // 模拟 Next.js redirect() 通过抛错来终止执行
    mockedRedirect.mockImplementation(() => {
      throw new Error('NEXT_REDIRECT')
    })
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  describe('requireAdmin', () => {
    it('开发环境且存在 dev-admin-bypass=1 cookie 时返回 Dev 用户且不查 session', async () => {
      vi.stubEnv('NODE_ENV', 'development')
      mockedCookies.mockReturnValue({
        get: (name: string) =>
          name === 'dev-admin-bypass' ? { value: '1' } : undefined,
      } as any)

      const result = await requireAdmin()

      expect(result).toEqual({ user: { name: 'Dev', email: 'dev@local' } })
      expect(mockedGetServerSession).not.toHaveBeenCalled()
      expect(mockedRedirect).not.toHaveBeenCalled()
    })

    it('非开发环境直接走 session 校验，有 session 时返回 session', async () => {
      vi.stubEnv('NODE_ENV', 'test')
      const session = { user: { name: 'Leon', email: 'leon@test.com' } }
      mockedGetServerSession.mockResolvedValue(session as any)

      const result = await requireAdmin()

      expect(result).toEqual(session)
      expect(mockedRedirect).not.toHaveBeenCalled()
    })

    it('无 session 时调用 redirect 跳转到 /admin/login', async () => {
      vi.stubEnv('NODE_ENV', 'test')
      mockedGetServerSession.mockResolvedValue(null as any)

      await expect(requireAdmin()).rejects.toThrow('NEXT_REDIRECT')
      expect(mockedRedirect).toHaveBeenCalledWith('/admin/login')
    })

    it('开发环境但 cookie 不为 1 时不走 bypass', async () => {
      vi.stubEnv('NODE_ENV', 'development')
      mockedCookies.mockReturnValue({
        get: () => undefined,
      } as any)
      const session = { user: { name: 'Leon', email: 'leon@test.com' } }
      mockedGetServerSession.mockResolvedValue(session as any)

      const result = await requireAdmin()

      expect(result).toEqual(session)
    })
  })

  describe('requireAdminApi', () => {
    it('提供正确的 x-admin-api-key 时返回 Admin 用户且不查 session', async () => {
      vi.stubEnv('ADMIN_API_KEY', 'secret-key')
      mockedHeaders.mockReturnValue({
        get: (name: string) =>
          name === 'x-admin-api-key' ? 'secret-key' : undefined,
      } as any)

      const result = await requireAdminApi()

      expect(result).toEqual({
        user: { name: 'Admin', email: 'admin@zshengzong.top' },
      })
      expect(mockedGetServerSession).not.toHaveBeenCalled()
    })

    it('API Key 不匹配时回落到 session 校验，无 session 返回 null', async () => {
      vi.stubEnv('ADMIN_API_KEY', 'secret-key')
      vi.stubEnv('NODE_ENV', 'test')
      mockedHeaders.mockReturnValue({
        get: () => 'wrong-key',
      } as any)
      mockedGetServerSession.mockResolvedValue(null as any)

      const result = await requireAdminApi()

      expect(result).toBeNull()
    })

    it('未配置 ADMIN_API_KEY 时跳过 API Key 通道', async () => {
      vi.stubEnv('ADMIN_API_KEY', '')
      vi.stubEnv('NODE_ENV', 'test')
      mockedGetServerSession.mockResolvedValue(null as any)

      const result = await requireAdminApi()

      expect(result).toBeNull()
      expect(mockedHeaders).not.toHaveBeenCalled()
    })

    it('开发环境且 dev bypass 时返回 Dev 用户', async () => {
      vi.stubEnv('NODE_ENV', 'development')
      vi.stubEnv('ADMIN_API_KEY', '')
      mockedCookies.mockReturnValue({
        get: (name: string) =>
          name === 'dev-admin-bypass' ? { value: '1' } : undefined,
      } as any)

      const result = await requireAdminApi()

      expect(result).toEqual({ user: { name: 'Dev', email: 'dev@local' } })
      expect(mockedGetServerSession).not.toHaveBeenCalled()
    })

    it('有 session 时返回该 session', async () => {
      vi.stubEnv('NODE_ENV', 'test')
      vi.stubEnv('ADMIN_API_KEY', '')
      const session = { user: { name: 'Leon', email: 'leon@test.com' } }
      mockedGetServerSession.mockResolvedValue(session as any)

      const result = await requireAdminApi()

      expect(result).toEqual(session)
    })
  })
})
