import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useSyncExternalStore } from 'react'
import { parseSearchParams } from '@/lib/search'
import type { SearchResponse } from '@/lib/search'

const nav = vi.hoisted(() => ({ value: '', listeners: new Set<() => void>(), push: vi.fn() }))
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: nav.push }),
  useSearchParams: () => new URLSearchParams(useSyncExternalStore(
    (fn) => { nav.listeners.add(fn); return () => { nav.listeners.delete(fn) } },
    () => nav.value,
  )),
}))
vi.mock('next/image', () => ({ default: () => null }))
import SearchClient from '@/app/search/SearchClient'

const fetchMock = vi.fn()
const response = (data: unknown, ok = true) => ({ ok, json: async () => data })
function result(url: string, overrides: Partial<SearchResponse> = {}): SearchResponse {
  const query = parseSearchParams(new URL(url, 'http://localhost').searchParams)
  return {
    ...query, total: 65, totalPages: 4, counts: { all: 65, post: 40, skill: 20, gallery: 5 },
    results: [{ type: 'post', id: 'one', title: `${query.q} article`, excerpt: 'summary', url: '/blog/one', tags: [], image: null, meta: '', created_at: '' }],
    ...overrides,
  }
}
async function settle() { await act(async () => { await Promise.resolve(); await Promise.resolve() }) }
function navigate(params: string) {
  act(() => { nav.value = params; nav.listeners.forEach(fn => fn()) })
}
beforeEach(() => {
  nav.value = 'q=RAG&type=all&page=1&sort=relevance'
  nav.push.mockReset().mockImplementation((url: string) => { nav.value = url.split('?')[1] ?? ''; nav.listeners.forEach(fn => fn()) })
  fetchMock.mockReset().mockImplementation(async (url: string) => response(result(url)))
  vi.stubGlobal('fetch', fetchMock)
  localStorage.clear()
})
afterEach(() => { cleanup(); vi.useRealTimers(); vi.unstubAllGlobals() })

describe('search state and asynchronous UI', () => {
  it('loads shareable URL state, true facets, and server-side pagination', async () => {
    nav.value = 'q=RAG&type=skill&page=2&sort=newest'
    render(<SearchClient />)
    await settle()
    expect(fetchMock.mock.calls[0][0]).toContain('type=skill&page=2&sort=newest')
    expect(screen.getByRole('tab', { name: '全部 65' })).toBeInTheDocument()
    expect(screen.getByText('第 2 / 4 页')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '下一页' }))
    await settle()
    expect(fetchMock.mock.calls.at(-1)?.[0]).toContain('page=3')
    fireEvent.click(screen.getByRole('tab', { name: '博客 40' }))
    await settle()
    expect(nav.value).toContain('type=post')
    expect(nav.value).toContain('page=1')
    fireEvent.change(screen.getByRole('combobox', { name: '搜索排序' }), { target: { value: 'relevance' } })
    await settle()
    expect(nav.value).toContain('sort=relevance&page=1')
  })

  it('restores input, category, page and sort after browser history navigation', async () => {
    render(<SearchClient />)
    await settle()
    navigate('q=Agent&type=gallery&page=2&sort=newest')
    await settle()
    expect(screen.getByRole('textbox')).toHaveValue('Agent')
    expect(screen.getByRole('tab', { name: '画廊 5' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('combobox')).toHaveValue('newest')
    expect(screen.getByText('第 2 / 4 页')).toBeInTheDocument()
    navigate('q=RAG&type=all&page=1&sort=relevance')
    await settle()
    expect(screen.getByRole('textbox')).toHaveValue('RAG')
  })

  it('debounces input and immediately blocks a pending stale response', async () => {
    vi.useFakeTimers()
    let resolveOld!: (value: unknown) => void
    fetchMock.mockImplementationOnce(() => new Promise(resolve => { resolveOld = resolve }))
    render(<SearchClient />)
    const oldSignal = fetchMock.mock.calls[0][1].signal as AbortSignal
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Agent' } })
    expect(oldSignal.aborted).toBe(true)
    await act(async () => { resolveOld(response(result('/api/search?q=RAG'))); await Promise.resolve() })
    expect(screen.queryByRole('heading', { name: 'RAG article' })).not.toBeInTheDocument()
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'DeepSeek' } })
    await act(async () => { await vi.advanceTimersByTimeAsync(349) })
    expect(fetchMock).toHaveBeenCalledTimes(1)
    await act(async () => { await vi.advanceTimersByTimeAsync(1) })
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(screen.getByRole('heading', { name: 'DeepSeek article' })).toBeInTheDocument()
  })

  it('cancels page requests and ignores late responses after selecting another category', async () => {
    render(<SearchClient />)
    await settle()
    let resolvePage!: (value: unknown) => void
    fetchMock.mockImplementationOnce(() => new Promise(resolve => { resolvePage = resolve }))
    fireEvent.click(screen.getByRole('button', { name: '下一页' }))
    await settle()
    const pageSignal = fetchMock.mock.calls.at(-1)?.[1].signal as AbortSignal
    fireEvent.click(screen.getByRole('tab', { name: 'Skills 搜索中' }))
    await settle()
    expect(pageSignal.aborted).toBe(true)
    await act(async () => { resolvePage(response(result('/api/search?q=RAG&page=2', { total: 999 }))); await Promise.resolve() })
    expect(screen.queryByText('共 999 条结果')).not.toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Skills 20' })).toHaveAttribute('aria-selected', 'true')
  })

  it('clearing also cancels a queued debounce and in-flight request', async () => {
    vi.useFakeTimers()
    render(<SearchClient />)
    await settle()
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'pending' } })
    fireEvent.click(screen.getByRole('button', { name: '清空' }))
    await act(async () => { await vi.advanceTimersByTimeAsync(1000) })
    expect(nav.value).toBe('')
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(screen.getByText('输入关键词开始搜索')).toBeInTheDocument()
  })

  it('shows server failures and retry without recommendations', async () => {
    fetchMock.mockResolvedValueOnce(response({}, false))
    render(<SearchClient />)
    await settle()
    expect(screen.getByRole('alert')).toHaveTextContent('搜索失败')
    expect(fetchMock).toHaveBeenCalledTimes(1)
    fireEvent.click(screen.getByRole('button', { name: '重新搜索' }))
    await settle()
    expect(screen.getByText('共 65 条结果')).toBeInTheDocument()
  })

  it('shows timeout separately from zero results', async () => {
    vi.useFakeTimers()
    fetchMock.mockImplementationOnce((_url, { signal }) => new Promise((_resolve, reject) => {
      signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')))
    }))
    render(<SearchClient />)
    await act(async () => { await vi.advanceTimersByTimeAsync(15000) })
    expect(screen.getByRole('alert')).toHaveTextContent('搜索超时')
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('only requests bounded recommendations for a true full-site zero, not an empty page or category', async () => {
    fetchMock.mockImplementation(async url => url.startsWith('/api/posts/public') ? response([]) : response(result(url, {
      results: [], total: 0, totalPages: 0, counts: { all: 10, post: 10, skill: 0, gallery: 0 },
    })))
    render(<SearchClient />)
    await settle()
    expect(fetchMock).toHaveBeenCalledTimes(1)
    fetchMock.mockImplementation(async url => url.startsWith('/api/posts/public') ? response([]) : response(result(url, {
      results: [], total: 0, totalPages: 0, counts: { all: 0, post: 0, skill: 0, gallery: 0 },
    })))
    navigate('q=missing')
    await settle()
    expect(fetchMock.mock.calls.at(-1)?.[0]).toBe('/api/posts/public?limit=4')
  })

  it('renders highlights and stored history as text, caps history at ten, and survives malformed storage', async () => {
    nav.value = 'q=img'
    localStorage.setItem('mindstack:search-history', JSON.stringify(Array.from({ length: 15 }, (_, i) => `<script>${i}</script>`)))
    fetchMock.mockImplementation(async url => response(result(url, { results: [{ ...result(url).results[0], title: '<img src=x onerror=alert(1)> img' }] })))
    const view = render(<SearchClient />)
    await settle()
    expect(view.container.querySelector('img, script')).toBeNull()
    expect(view.container.querySelector('mark')).toHaveTextContent('img')
    expect(JSON.parse(localStorage.getItem('mindstack:search-history')!)).toHaveLength(10)
    fireEvent.click(screen.getByRole('button', { name: '清空' }))
    await settle()
    fireEvent.focus(screen.getByRole('textbox'))
    expect(screen.getByText('<script>0</script>')).toBeInTheDocument()
    expect(view.container.querySelector('script')).toBeNull()
    cleanup()
    localStorage.setItem('mindstack:search-history', '{bad json')
    render(<SearchClient />)
    await settle()
    expect(screen.getByRole('textbox')).toHaveValue('')
  })
})
