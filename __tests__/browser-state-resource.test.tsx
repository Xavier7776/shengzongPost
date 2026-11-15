import { createElement } from 'react'
import { act, cleanup, fireEvent, render, renderHook, screen } from '@testing-library/react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useHydrated, useStoredString, notifyStorageChange } from '@/shared/browser-state'
import { useJsonResource } from '@/shared/use-json-resource'
import { usePreferences } from '@/shared/use-preferences'
import AvatarImage from '@/components/ui/AvatarImage'

vi.mock('next/image', () => ({ default: (props: React.ComponentProps<'img'>) => createElement('img', props) }))
afterEach(() => { cleanup(); vi.useRealTimers(); vi.restoreAllMocks(); vi.unstubAllGlobals(); localStorage.clear() })
const response = (data: unknown, ok = true) => ({ ok, json: async () => data })

describe('browser snapshots', () => {
  function Snapshot() {
    return <output>{String(useHydrated())}:{useStoredString('test-snapshot') ?? 'empty'}</output>
  }
  it('keeps SSR independent of persisted browser state, then subscribes to changes', () => {
    localStorage.setItem('test-snapshot', 'saved')
    expect(renderToStaticMarkup(<Snapshot />)).toContain('false:empty')
    render(<Snapshot />)
    expect(screen.getByText('true:saved')).toBeInTheDocument()
    act(() => { localStorage.setItem('test-snapshot', 'changed'); notifyStorageChange() })
    expect(screen.getByText('true:changed')).toBeInTheDocument()
    act(() => { localStorage.removeItem('test-snapshot'); window.dispatchEvent(new StorageEvent('storage')) })
    expect(screen.getByText('true:empty')).toBeInTheDocument()
  })
  it('keeps preferences usable when storage is blocked', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw Error('blocked') })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw Error('blocked') })
    const { result } = renderHook(() => usePreferences())
    act(() => result.current.savePreferences({ showLikes: false, showBookmarks: false }))
    expect(result.current.showLikes).toBe(false)
    expect(result.current.showBookmarks).toBe(false)
  })
  it('shows a newly uploaded avatar after the previous source failed', () => {
    const { rerender } = render(<AvatarImage src="old.jpg" alt="User" size={32} />)
    fireEvent.error(screen.getByRole('img'))
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
    rerender(<AvatarImage src="new.jpg" alt="User" size={32} />)
    expect(screen.getByRole('img')).toHaveAttribute('src', 'new.jpg')
  })
})

describe('keyed asynchronous resources', () => {
  it('retains the current data when a background refresh fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(response({ count: 4 })).mockRejectedValue(Error('offline')))
    const { result } = renderHook(() => useJsonResource('/api/count', { count: 0 }))
    await act(async () => { await Promise.resolve() })
    act(() => result.current.reload())
    await act(async () => { await Promise.resolve() })
    expect(result.current.data.count).toBe(4)
    expect(result.current.error).toBe('offline')
    expect(result.current.loading).toBe(false)
  })
  it('keeps the current identity visible during refresh without leaking it to another account', async () => {
    let resolveRefresh!: (value: unknown) => void
    const fetchMock = vi.fn().mockResolvedValueOnce(response(['saved']))
      .mockImplementation(() => new Promise(resolve => { resolveRefresh = resolve }))
    vi.stubGlobal('fetch', fetchMock)
    const { result, rerender } = renderHook(({ scope }) => useJsonResource<string[]>('/api/private', [], scope), { initialProps: { scope: 'one' } })
    await act(async () => { await Promise.resolve() })
    act(() => result.current.reload())
    expect(result.current.loading).toBe(true)
    expect(result.current.data).toEqual(['saved'])
    await act(async () => { resolveRefresh(response(['fresh'])); await Promise.resolve() })
    expect(result.current.data).toEqual(['fresh'])
    rerender({ scope: 'two' })
    expect(result.current.data).toEqual([])
  })
  it('cancels old requests and ignores their late responses after changing identity', async () => {
    let resolveOld!: (value: unknown) => void
    const fetchMock = vi.fn().mockImplementationOnce(() => new Promise(resolve => { resolveOld = resolve }))
      .mockResolvedValue(response(['new account']))
    vi.stubGlobal('fetch', fetchMock)
    const { result, rerender } = renderHook(({ scope }) => useJsonResource<string[]>('/api/private', [], scope), { initialProps: { scope: 'user-1' } })
    const oldSignal = fetchMock.mock.calls[0][1].signal as AbortSignal
    expect(result.current.loading).toBe(true)
    rerender({ scope: 'user-2' })
    expect(oldSignal.aborted).toBe(true)
    expect(result.current.data).toEqual([])
    await act(async () => { await Promise.resolve() })
    expect(result.current.data).toEqual(['new account'])
    await act(async () => { resolveOld(response(['old account'])); await Promise.resolve() })
    expect(result.current.data).toEqual(['new account'])
  })
  it('does not request private resources while disabled', async () => {
    const fetchMock = vi.fn().mockResolvedValue(response(['private']))
    vi.stubGlobal('fetch', fetchMock)
    const { result, rerender } = renderHook(({ enabled }) => useJsonResource<string[]>(enabled ? '/api/private' : null, []), { initialProps: { enabled: true } })
    await act(async () => { await Promise.resolve() })
    expect(result.current.data).toEqual(['private'])
    rerender({ enabled: false })
    expect(result.current.data).toEqual([])
    expect(result.current.loading).toBe(false)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
  it('clears loading after failures and permits an explicit retry', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(response({}, false)).mockResolvedValue(response(['recovered']))
    vi.stubGlobal('fetch', fetchMock)
    const { result } = renderHook(() => useJsonResource<string[]>('/api/list', []))
    await act(async () => { await Promise.resolve() })
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toContain('加载失败')
    act(() => result.current.reload())
    expect(result.current.loading).toBe(true)
    await act(async () => { await Promise.resolve() })
    expect(result.current.data).toEqual(['recovered'])
    expect(result.current.error).toBeNull()
  })
  it('bounds stalled requests and cancels them on unmount', async () => {
    vi.useFakeTimers()
    const fetchMock = vi.fn((_url, { signal }: { signal: AbortSignal }) => new Promise((_resolve, reject) => {
      signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')))
    }))
    vi.stubGlobal('fetch', fetchMock)
    const { result, unmount } = renderHook(() => useJsonResource<string[]>('/api/slow', []))
    await act(async () => { await vi.advanceTimersByTimeAsync(15000) })
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toContain('超时')
    act(() => result.current.reload())
    const signal = fetchMock.mock.calls.at(-1)![1].signal
    unmount()
    expect(signal.aborted).toBe(true)
    expect(vi.getTimerCount()).toBe(0)
  })
})
