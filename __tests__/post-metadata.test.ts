import { beforeEach, expect, it, vi } from 'vitest'

const { getPost, notFound } = vi.hoisted(() => ({
  getPost: vi.fn(),
  notFound: vi.fn(() => { throw new Error('NEXT_NOT_FOUND') }),
}))
vi.mock('@/lib/db', () => ({ getPostBySlug: getPost, getAdjacentPosts: vi.fn() }))
vi.mock('@/lib/db/_core', () => ({ sql: vi.fn() }))
vi.mock('next/navigation', () => ({ notFound }))
import { generateMetadata } from '@/app/blog/[slug]/page'

beforeEach(() => { getPost.mockReset(); notFound.mockClear() })

it('rejects a missing public article before emitting its metadata', async () => {
  getPost.mockResolvedValue(null)
  await expect(generateMetadata({ params: Promise.resolve({ slug: 'missing' }) })).rejects.toThrow('NEXT_NOT_FOUND')
  expect(notFound).toHaveBeenCalledOnce()
})

it('preserves the published article title and original timestamps', async () => {
  getPost.mockResolvedValue({ title: 'Published', created_at: '2026-10-01', updated_at: '2026-10-09' })
  expect(await generateMetadata({ params: Promise.resolve({ slug: 'published' }) })).toMatchObject({
    title: 'Published — ARC.',
    openGraph: { publishedTime: '2026-10-01', modifiedTime: '2026-10-09' },
  })
  expect(notFound).not.toHaveBeenCalled()
})
