import { fireEvent, render, screen } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import { signIn } from 'next-auth/react'
import LoginPage from '@/app/admin/login/page'

vi.mock('next-auth/react', () => ({ signIn: vi.fn() }))
vi.mock('next/navigation', () => ({ useRouter: () => ({}) }))

it.each([
  ['study', '登录 MindStack 学习计划', '/study'],
  [undefined, 'MindStack 管理后台', '/'],
  ['https://example.org', 'MindStack 管理后台', '/'],
] as const)('returns the %s entry to its intended destination', async (from, title, callbackUrl) => {
  render(await LoginPage({ searchParams: Promise.resolve({ from }) }))
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(title)
  fireEvent.click(screen.getByRole('button', { name: 'GitHub 登录' }))
  expect(signIn).toHaveBeenLastCalledWith('github', { callbackUrl })
})
