import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import LearnToc from '@/app/blog/[slug]/LearnToc'
import PostHeader from '@/app/blog/[slug]/PostHeader'
import BlogReaderToolbar from '@/app/blog/[slug]/BlogReaderToolbar'

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
afterEach(() => vi.restoreAllMocks())

describe('daily learn layout compatibility', () => {
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
      <div id="blog-reader-root">
        <div className="reader-content">Reading</div>
        <BlogReaderToolbar variant="learn" />
      </div>
    )
    await screen.findByText('18px')
    const reader = document.querySelector('.reader-content') as HTMLElement
    await waitFor(() => expect(reader.style.getPropertyValue('--reader-font-size')).toBe('18px'))
    unmount()
    render(
      <div id="blog-reader-root">
        <div className="reader-content">Reading</div>
        <BlogReaderToolbar />
      </div>
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
})
