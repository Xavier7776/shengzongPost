import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { makeEdition } from './fixtures/learn-edition'
import type { Post } from '@/lib/db/posts'
const { sql } = vi.hoisted(() => ({ sql: vi.fn() }))
vi.mock('@/lib/db/_core', () => ({ sql }))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))
vi.mock('@/components/sections/AttachmentList', () => ({ default: () => null }))
vi.mock('@/components/sections/CodeCopyButton', () => ({ default: () => null }))
vi.mock('@/components/sections/ImageLazyLoad', () => ({ default: () => null }))
import LearnIndex from '@/app/learn/page'
import PostContent from '@/app/blog/[slug]/PostContent'
import { textVersion } from '@/lib/learn/publish'

const post: Post = { id: 1, slug: 'daily-learn-2026-10-08', title: 'Legacy article', excerpt: '', content: '旧文章正文仍应显示', tags: [], published: true, created_at: '2026-10-08T01:00:00Z', updated_at: '2026-10-08T01:00:00Z', cover_image: null }
beforeEach(() => { sql.mockReset() })
describe('learn migration and legacy article compatibility', () => {
  it('keeps the index available before the migration is applied', async () => {
    sql.mockRejectedValue({ code: '42P01' })
    render(await LearnIndex({}))
    expect(screen.getByText('精读专刊准备中，敬请期待。')).toBeInTheDocument()
  })
  it('keeps unexpected database failures visible', async () => {
    sql.mockRejectedValue(new Error('connection lost'))
    await expect(LearnIndex({})).rejects.toThrow('connection lost')
  })
  it('preserves a legacy article with the daily-learn prefix', async () => {
    sql.mockResolvedValue([])
    render(await PostContent({ post }))
    expect(screen.getByText('旧文章正文仍应显示')).toBeInTheDocument()
  })
  it('renders current structured editions and preserves later manual edits', async () => {
    const edition = makeEdition()
    sql.mockResolvedValue([{ ...post, title:edition.title, document: edition, content:textVersion(edition), post_id:post.id, edition_date:edition.date, topic:edition.topic, status:'published' }])
    const { unmount } = render(await PostContent({ post: { ...post, content: textVersion(edition) } }))
    expect(screen.getByText('教学示例数据，非论文实验结果')).toBeInTheDocument()
    unmount()
    render(await PostContent({ post: { ...post, content: '管理员修改后的正文' } }))
    expect(screen.getByText('管理员修改后的正文')).toBeInTheDocument()
    expect(screen.queryByText('教学示例数据，非论文实验结果')).not.toBeInTheDocument()
  })
})
vi.mock('@/components/learn/LearningPaths', () => ({ default: () => null }))
