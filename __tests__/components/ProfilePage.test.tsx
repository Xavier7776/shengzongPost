import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import ProfilePage from '@/app/profile/page'
import UserProfilePage from '@/app/profile/[userId]/page'

const { auth, navigation } = vi.hoisted(() => ({
  auth: { data: { user: { id: '7', name: '测试用户', image: '' } }, status: 'authenticated', update: vi.fn() },
  navigation: { router: { push: vi.fn() }, userId: '7', searchParams: new URLSearchParams() },
}))
vi.mock('next-auth/react', () => ({ useSession: () => auth, signOut: vi.fn() }))
vi.mock('next/navigation', () => ({
  useRouter: () => navigation.router,
  useParams: () => ({ userId: navigation.userId }),
  useSearchParams: () => navigation.searchParams,
}))
vi.mock('@/components/shop/FrameSelector', () => ({ default: () => null }))
vi.mock('@/components/shop/CursorSelector', () => ({ default: () => null }))
vi.mock('@/components/sections/ReadingHistory', () => ({ getReadingHistory: () => [{ slug: 'read-post', title: '我的浏览记录', readAt: '2026-10-01' }] }))

const fetchMock = vi.fn()
beforeEach(() => {
  navigation.userId = '7'
  navigation.searchParams = new URLSearchParams()
  auth.update.mockReset()
  navigation.router.push.mockReset()
  localStorage.clear()
  fetchMock.mockReset().mockImplementation(async (url: string) => ({
    ok: true,
    json: async () => url.startsWith('/api/user/profile')
      ? { id: Number(navigation.userId), name: '测试用户', email: 'test@example.test', points: 123, tech_stack: ['React'] }
      : url.startsWith('/api/follows')
      ? { following: 2, followers: 3, isFollowing: false, isMutual: false }
      : url.startsWith('/api/points') ? { points: 123 } : [],
  }))
  vi.stubGlobal('fetch', fetchMock)
})
afterEach(() => vi.unstubAllGlobals())

describe('Profile 路由拆分回归', () => {
  it('修改昵称后保存原有资料字段，并同步会话', async () => {
    render(<ProfilePage />)
    const name = await screen.findByDisplayValue('测试用户')
    fireEvent.change(name, { target: { value: '新昵称' } })
    fireEvent.click(screen.getByRole('button', { name: '保存更改' }))
    await waitFor(() => expect(auth.update).toHaveBeenCalledWith({ name: '新昵称', image: '' }))
    const request = fetchMock.mock.calls.find(([url, options]) => url === '/api/user/profile' && options?.method === 'PATCH')
    const saved = JSON.parse(request![1].body)
    expect(saved).toMatchObject({ name: '新昵称', tech_stack: ['React'] })
    expect(saved).not.toHaveProperty('id')
    expect(saved).not.toHaveProperty('email')
    expect(screen.getByRole('button', { name: '已保存' })).toBeInTheDocument()
  })

  it('账户安全在提交前校验验证码和密码长度，切换标签保留输入', async () => {
    render(<ProfilePage />)
    await screen.findByDisplayValue('测试用户')
    fireEvent.click(screen.getAllByRole('button', { name: '账户安全' })[0])
    fireEvent.click(screen.getByRole('button', { name: '立即发送' }))
    const code = await screen.findByPlaceholderText('6 位数字')
    fireEvent.click(screen.getByRole('button', { name: '确认修改' }))
    expect(screen.getByText('请输入验证码')).toBeInTheDocument()
    fireEvent.change(code, { target: { value: '123456' } })
    fireEvent.change(screen.getByPlaceholderText('至少 8 位'), { target: { value: 'short' } })
    fireEvent.click(screen.getByRole('button', { name: '确认修改' }))
    expect(screen.getByText('新密码至少 8 位')).toBeInTheDocument()
    fireEvent.click(screen.getAllByRole('button', { name: '个人资料' })[0])
    fireEvent.click(screen.getAllByRole('button', { name: '账户安全' })[0])
    expect(screen.getByPlaceholderText('6 位数字')).toHaveValue('123456')
    expect(fetchMock.mock.calls.some(([url, options]) => url === '/api/user/password' && options?.method === 'PATCH')).toBe(false)
  })

  it('他人主页不显示或加载收藏和浏览记录，保留粉丝链接参数', async () => {
    navigation.userId = '8'
    navigation.searchParams = new URLSearchParams('tab=followers')
    render(<UserProfilePage />)
    await screen.findAllByRole('heading', { name: '测试用户' })
    expect(screen.queryByRole('button', { name: '收藏夹' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '浏览记录' })).not.toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledWith('/api/follows?userId=8&list=followers')
    expect(fetchMock).not.toHaveBeenCalledWith('/api/bookmarks')
    expect(screen.queryByText('我的浏览记录')).not.toBeInTheDocument()
  })

  it('本人主页在收藏标签加载收藏，并可以查看本地浏览记录', async () => {
    render(<UserProfilePage />)
    await screen.findAllByRole('heading', { name: '测试用户' })
    fireEvent.click(screen.getAllByRole('button', { name: '收藏夹' })[0])
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/api/bookmarks'))
    fireEvent.click(screen.getAllByRole('button', { name: '浏览记录' })[0])
    expect(screen.getAllByRole('link', { name: /我的浏览记录/ })[0]).toHaveAttribute('href', '/blog/read-post')
  })
})
