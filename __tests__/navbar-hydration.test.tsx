import React, { act } from 'react'
import { renderToString } from 'react-dom/server'
import { hydrateRoot } from 'react-dom/client'
import { afterEach, expect, it, vi } from 'vitest'
import Navbar from '@/components/layout/Navbar'

const navigation = vi.hoisted(() => ({ pathname: '/learn' }))
vi.mock('next/navigation', () => ({ usePathname: () => navigation.pathname, useRouter: () => ({ push: vi.fn() }) }))
vi.mock('next-auth/react', () => ({ useSession: () => ({ data: null }), signOut: vi.fn() }))
vi.mock('next/link', () => ({ default: ({ children, ...props }: React.ComponentProps<'a'>) => <a {...props}>{children}</a> }))
vi.mock('next/image', () => ({ default: (props: React.ComponentProps<'img'>) => React.createElement('img', props) }))
vi.mock('@/components/layout/UserMenu', () => ({ default: () => null }))
vi.mock('@/components/layout/NotificationBell', () => ({ default: () => null }))

afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); document.body.innerHTML = '' })

it('hydrates route-dependent active links consistently and then tracks the browser route', async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => { callback(0); return 0 })
  const errors: unknown[] = []
  const consoleError = vi.spyOn(console, 'error').mockImplementation((...args) => errors.push(args))
  navigation.pathname = '/learn'
  const host = document.createElement('div')
  host.innerHTML = renderToString(<Navbar />)
  document.body.append(host)
  expect(host.querySelector('nav a[href="/learn"] span')).toBeNull()
  navigation.pathname = '/blog/daily-learn-2026-10-09'
  let root: ReturnType<typeof hydrateRoot> | undefined
  try {
    await act(async () => { root = hydrateRoot(host, <Navbar />, { onRecoverableError: error => errors.push(error) }) })
    expect(host.querySelector('nav a[href="/blog"] span')).not.toBeNull()
    expect(host.querySelector('nav a[href="/learn"] span')).toBeNull()
    navigation.pathname = '/learn'
    await act(async () => { root?.render(<Navbar />) })
    expect(host.querySelector('nav a[href="/learn"] span')).not.toBeNull()
    expect(host.querySelector('nav a[href="/blog"] span')).toBeNull()
    expect(errors).toEqual([])
  } finally {
    await act(async () => root?.unmount())
    consoleError.mockRestore()
  }
})
