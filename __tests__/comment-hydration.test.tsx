import { act } from '@testing-library/react'
import { renderToString } from 'react-dom/server'
import { hydrateRoot } from 'react-dom/client'
import { afterEach, expect, it, vi } from 'vitest'
import CommentSection from '@/components/sections/CommentSection'

const auth = vi.hoisted(() => ({ status: 'loading', data: null }))
vi.mock('next-auth/react', () => ({ useSession: () => auth }))
afterEach(() => vi.restoreAllMocks())

it('hydrates streamed comments when the session has already resolved', async () => {
  vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('[]'))
  const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
  const container = document.createElement('div')
  auth.status = 'loading'
  container.innerHTML = renderToString(<CommentSection slug="daily-learn-test" />)
  document.body.append(container)
  auth.status = 'unauthenticated'
  const recoverable = vi.fn()
  let root: ReturnType<typeof hydrateRoot>
  try {
    await act(async () => {
      root = hydrateRoot(container, <CommentSection slug="daily-learn-test" />, { onRecoverableError: recoverable })
    })
    expect(recoverable).not.toHaveBeenCalled()
    expect(consoleError).not.toHaveBeenCalled()
    expect(container.textContent).toContain('登录后参与评论')
  } finally {
    await act(async () => { root!.unmount() })
    container.remove()
    auth.status = 'loading'
  }
})
