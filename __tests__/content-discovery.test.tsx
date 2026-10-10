import { render, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { PostMeta } from '@/lib/db/posts'
import { postSeries, publicDiscoveryPosts, relatedPosts, READING_SERIES } from '@/lib/content-discovery'
const { load } = vi.hoisted(() => ({ load: vi.fn() }))
vi.mock('@/lib/db/discovery', () => ({ getDiscoveryContent: load }))
import RelatedContent from '@/components/sections/RelatedContent'
import LearningPaths from '@/components/learn/LearningPaths'
const post = (slug: string, tags: string[] = [], date = '2026-01-01'): PostMeta => ({ id: 1, slug, title: slug, excerpt: 'Public summary', published: true, tags, created_at: date, updated_at: date, cover_image: null })
beforeEach(() => { load.mockReset() })
describe('public content discovery', () => {
  it('ranks same series before shared tags, related topics and latest updates; excludes self, drafts, duplicates and unsafe routes', () => {
    const current = post('rag-deep-dive', ['RAG'])
    const series = post('ai-agent-memory-knowledge-graphs-20260531', [], '2025-01-01')
    const shared = post('rag-practice', ['rag'], '2026-02-01')
    const topic = post('memory-notes', ['memory'], '2026-03-01')
    const recent = post('latest', ['AI'], '2026-04-01')
    const result = relatedPosts([current, series, shared, shared, topic, recent, { ...post('draft'), published: false }, post('../admin')], current)
    expect(result.map(r => r.post.slug)).toEqual([series.slug, shared.slug, topic.slug, recent.slug])
    expect(result.map(r => r.reason)).toEqual(['同系列 · RAG 与长期记忆', '共同标签 · rag', '相近主题 · RAG 与长期记忆', '最近更新'])
  })
  it('supports editorial membership through existing tags, normalizes case and keeps generic AI tags out of relevance', () => {
    expect(postSeries(post('new-series-member', ['系列:Agent 架构与治理']))[0].title).toBe('Agent 架构与治理')
    const result = relatedPosts([post('old-ai', ['AI'], '2024-01-01'), post('new-general', [], '2026-01-01')], post('unknown', ['AI']))
    expect(result[0].post.slug).toBe('new-general')
    expect(result.every(r => r.reason === '最近更新')).toBe(true)
  })
  it('has a bounded deterministic fallback, and a disabled-only corpus yields no links', () => {
    const posts = Array.from({ length: 10 }, (_, i) => ({ ...post('p'+i), id: i+1 }))
    expect(relatedPosts(posts).map(r => r.post.slug)).toEqual(['p9', 'p8', 'p7', 'p6', 'p5'])
    expect(relatedPosts(posts.map(p => ({ ...p, published: false })))).toEqual([])
    expect(publicDiscoveryPosts([post('中文标题'), post('..'), post('a/b')]).map(p => p.slug)).toEqual(['中文标题'])
  })
  it('renders only available route steps, filters by topic, and makes curation status explicit', async () => {
    const posts = READING_SERIES.flatMap(s => s.steps.map(step => post(step.slug)))
    load.mockResolvedValue({ posts: posts.map(p => p.slug === 'context-engineering-ai-agents-20260610' ? { ...p, published: false } : p), projects: [] })
    render(await LearningPaths({ topic: 'rag' }))
    expect(screen.getByRole('region', { name: '建议学习路线' })).toHaveTextContent('不是官方必修课程')
    expect(screen.getAllByRole('link')).toHaveLength(3)
    expect(screen.queryByRole('link', { name: /context-engineering/ })).not.toBeInTheDocument()
    expect(screen.queryByText('Agent 架构与治理')).not.toBeInTheDocument()
    expect(await LearningPaths({ topic: 'multimodal' })).toBeNull()
  })
  it('shows five public suggestions and an enabled project; suppresses a withdrawn source and safely degrades on errors', async () => {
    const posts = [post('rag-deep-dive', ['RAG']), ...Array.from({ length: 7 }, (_, i) => post('p'+i))]
    load.mockResolvedValue({ posts, projects: [{ slug: 'Mnemo', name: 'Mnemo' }] })
    render(await RelatedContent({ slug: 'rag-deep-dive' }))
    expect(within(screen.getByRole('list')).getAllByRole('link')).toHaveLength(5)
    expect(screen.getByRole('link', { name: '工程案例 · Mnemo' })).toHaveAttribute('href', '/work/Mnemo')
    expect(screen.queryByRole('link', { name: /rag-deep-dive/ })).not.toBeInTheDocument()
    expect(await RelatedContent({ slug: 'unpublished' })).toBeNull()
    load.mockRejectedValue(new Error('private connection details'))
    const log = vi.spyOn(console, 'error').mockImplementation(() => {})
    try {
      const related = await RelatedContent({ slug: 'rag-deep-dive' })
      expect(related).toBeNull()
      const paths = await LearningPaths({ topic: null })
      expect(paths).toBeNull()
      expect(JSON.stringify(log.mock.calls)).not.toContain('private connection details')
    } finally { log.mockRestore() }
  })
  it('prioritizes curated project architecture articles without claiming their metrics are project benchmarks', async () => {
    load.mockResolvedValue({ posts: [post('rag-deep-dive'), post('latest', [], '2026-10-10')], projects: [] })
    render(await RelatedContent({ projectSlug: 'Mnemo' }))
    const region = screen.getByRole('region', { name: '项目相关技术文章' })
    expect(within(region).getAllByRole('link')[0]).toHaveAttribute('href', '/blog/rag-deep-dive')
    expect(region).toHaveTextContent('项目实际 Benchmarks')
  })
})
