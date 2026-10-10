import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { makeEdition } from './fixtures/learn-edition'
const { sql, post } = vi.hoisted(() => ({ sql: vi.fn(), post: vi.fn() }))
vi.mock('@/lib/db/_core', () => ({ sql }))
vi.mock('@/lib/db', () => ({ getPostBySlug: post }))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))
vi.mock('@/components/sections/AttachmentList', () => ({ default: () => null }))
vi.mock('@/components/sections/CodeCopyButton', () => ({ default: () => null }))
vi.mock('@/components/sections/ImageLazyLoad', () => ({ default: () => null }))
import LearnIndex from '@/app/learn/page'
import PostContent from '@/app/blog/[slug]/PostContent'
import { textVersion } from '@/lib/learn/publish'

beforeEach(() => { sql.mockReset(); post.mockReset() })
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
    post.mockResolvedValue({ content: '旧文章正文仍应显示' })
    sql.mockResolvedValue([])
    render(await PostContent({ slug: 'daily-learn-2026-10-08' }))
    expect(screen.getByText('旧文章正文仍应显示')).toBeInTheDocument()
  })
  it('renders current structured editions and preserves later manual edits', async () => {
    const edition = makeEdition()
    sql.mockResolvedValue([{ document: edition }])
    post.mockResolvedValue({ content: textVersion(edition) })
    const { unmount } = render(await PostContent({ slug: 'daily-learn-2026-10-08' }))
    expect(screen.getByText('教学示例数据，非论文实验结果')).toBeInTheDocument()
    unmount()
    post.mockResolvedValue({ content: '管理员修改后的正文' })
    render(await PostContent({ slug: 'daily-learn-2026-10-08' }))
    expect(screen.getByText('管理员修改后的正文')).toBeInTheDocument()
    expect(screen.queryByText('教学示例数据，非论文实验结果')).not.toBeInTheDocument()
  })
})
vi.mock('@/components/learn/LearningPaths', () => ({ default: () => null }))
