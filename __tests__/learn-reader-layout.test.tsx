import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import LearnToc from '@/app/blog/[slug]/LearnToc'
import PostHeader from '@/app/blog/[slug]/PostHeader'
import BlogReaderToolbar from '@/app/blog/[slug]/BlogReaderToolbar'
import ViewTracker from '@/components/sections/ViewTracker'

const { getPost } = vi.hoisted(() => ({ getPost: vi.fn() }))
vi.mock('@/lib/db', () => ({ getPostBySlug: getPost }))
vi.mock('@/components/sections/AuthorCard', () => ({
  default: () => <div data-testid="legacy-author-card">Full author card</div>,
}))

beforeEach(() => {
  getPost.mockReset().mockResolvedValue({
    slug: 'daily-learn-2026-10-09',
    title: '结构化切块真的让 RAG 更准吗？用安慰剂实验拆解四种检索机制',
    excerpt: '用实验区分结构切块、真实标题与两阶段路由的收益。',
    content: '阅读时间约 23 分钟，动手实验约 25 分钟。\\n' + '正文'.repeat(500),
    created_at: '2026-10-09T01:00:00Z',
    tags: ['RAG 与检索', '自动发布', 'AI技术精读'],
    author_id: 1,
    author_name: 'Xavier',
    author_bio: 'Too long for the edition byline',
    author_avatar: null,
  })
  localStorage.clear()
})
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals() })

describe('daily learn layout compatibility', () => {
  it.each([0, 240])('avoids initial layout reads at the top and measures restored position %d', position => {
    vi.stubGlobal('scrollY', position)
    const requestFrame = vi.spyOn(window, 'requestAnimationFrame').mockReturnValue(1)
    const cancelFrame = vi.spyOn(window, 'cancelAnimationFrame')
    const measure = vi.spyOn(Element.prototype, 'getBoundingClientRect')
    const { unmount } = render(<><div id="blog-reader-root"><div className="reader-content"><h2 id="first">First chapter</h2></div></div><LearnToc /></>)
    expect(measure).not.toHaveBeenCalled()
    if (position === 0) {
      expect(requestFrame).not.toHaveBeenCalled()
      expect(screen.getByRole('button', { name: 'First chapter' })).toHaveAttribute('aria-current', 'location')
      fireEvent.scroll(window)
    }
    expect(requestFrame).toHaveBeenCalledTimes(1)
    act(() => requestFrame.mock.calls[0][0](0))
    expect(measure).toHaveBeenCalled()
    fireEvent.scroll(window)
    expect(requestFrame).toHaveBeenCalledTimes(2)
    unmount()
    expect(cancelFrame).toHaveBeenCalledWith(1)
  })
  it('uses a compact edition byline with explicit lesson and practice estimates', async () => {
    render(await PostHeader({ slug: 'daily-learn-2026-10-09', variant: 'learn' }))
    expect(screen.getByRole('heading', { level: 1 })).toHaveClass('learn-post-title')
    expect(screen.getByText('预计阅读 23 分钟')).toBeInTheDocument()
    expect(screen.getByText('动手练习约 25 分钟')).toBeInTheDocument()
    expect(screen.getByText('Xavier')).toBeInTheDocument()
    expect(screen.queryByTestId('legacy-author-card')).not.toBeInTheDocument()
    expect(screen.queryByText('自动发布')).not.toBeInTheDocument()
  })

  it('keeps the original author card for ordinary blog posts', async () => {
    render(await PostHeader({ slug: 'normal-post' }))
    expect(screen.getByTestId('legacy-author-card')).toBeInTheDocument()
    expect(screen.queryByText('动手练习约 25 分钟')).not.toBeInTheDocument()
  })

  it('defaults the edition reader to 18px without changing the standard reader default', async () => {
    const { unmount } = render(
      <article id="blog-reader-root">
        <div className="reader-content">Reading</div>
        <BlogReaderToolbar variant="learn" />
      </article>
    )
    await screen.findByText('18px')
    const reader = document.querySelector('article') as HTMLElement
    await waitFor(() => expect(reader.style.getPropertyValue('--reader-font-size')).toBe('18px'))
    unmount()
    render(
      <article id="blog-reader-root">
        <div className="reader-content">Reading</div>
        <BlogReaderToolbar />
      </article>
    )
    await screen.findByText('16px')
  })

  it('creates a collapsible chapter drawer even when headings arrive asynchronously', async () => {
    const scrollIntoView = vi.fn()
    vi.stubGlobal('scrollIntoView', scrollIntoView)
    Object.defineProperty(Element.prototype, 'scrollIntoView', {
      configurable: true,
      value: scrollIntoView,
    })
    const { container } = render(
      <div>
        <div id="blog-reader-root">
          <div className="reader-content" />
        </div>
        <LearnToc />
      </div>
    )
    expect(screen.queryByText('学习目录')).not.toBeInTheDocument()
    const reader = container.querySelector('.reader-content')!
    act(() => {
      reader.innerHTML = '<h2>基础认知</h2><h3>结构边界</h3><h2>工程实验</h2>'
    })
    await screen.findByRole('complementary', { name: '专刊章节导航' })
    const floating = screen.getByRole('button', { name: /章节/ })
    expect(floating).toHaveAttribute('aria-expanded', 'false')
    fireEvent.click(floating)
    const drawer = screen.getByRole('dialog', { name: '专刊章节' })
    expect(drawer).toBeInTheDocument()
    fireEvent.click(within(drawer).getByRole('button', { name: '基础认知' }))
    expect(scrollIntoView).toHaveBeenCalled()
    expect(screen.queryByRole('dialog', { name: '专刊章节' })).not.toBeInTheDocument()
  })
  it('applies saved preferences without mutating streamed article markup', async () => {
    localStorage.setItem('learn-reader-font-size', '22')
    localStorage.setItem('blog-reader-mode', 'sepia')
    const { container } = render(<article><BlogReaderToolbar variant="learn" /></article>)
    await screen.findByText('22px')
    const article = container.querySelector('article')!
    act(() => {
      article.insertAdjacentHTML('beforeend', '<div class="reader-content"><p>Streamed content</p></div>')
    })
    expect(article.style.getPropertyValue('--reader-font-size')).toBe('22px')
    expect(article).toHaveClass('reader-mode-sepia')
    expect(article.querySelector('.reader-content')!.getAttribute('class')).toBe('reader-content')
    expect(article.querySelector('.reader-content')).not.toHaveAttribute('style')
  })
  it('keeps font and mode controls usable when browser storage is blocked', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new DOMException('Denied', 'SecurityError') })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new DOMException('Denied', 'SecurityError') })
    render(<article><div className="reader-content" /><BlogReaderToolbar variant="learn" /></article>)
    expect(screen.getByText('18px')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '放大字号' }))
    expect(screen.getByText('20px')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '缩小字号' }))
    expect(screen.getByText('18px')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '深色模式' }))
    expect(document.querySelector('article')).toHaveClass('reader-mode-dark')
  })
  it.each(['getItem', 'setItem'] as const)('skips view counting when session storage %s fails', method => {
    sessionStorage.clear()
    vi.spyOn(Storage.prototype, method).mockImplementation(() => { throw new DOMException('Denied', 'SecurityError') })
    const fetch = vi.spyOn(globalThis, 'fetch')
    render(<ViewTracker slug="daily-learn-2026-10-09" />)
    expect(fetch).not.toHaveBeenCalled()
  })
})
