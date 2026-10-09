// @vitest-environment node
import { beforeEach, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
const { all, paginated } = vi.hoisted(() => ({ all: vi.fn(), paginated: vi.fn() }))
vi.mock('@/lib/db', () => ({ getAllPosts: all, getPostsPaginated: paginated }))
import { GET } from '@/app/api/posts/public/route'
beforeEach(() => { all.mockReset(); paginated.mockReset() })
it('keeps the full metadata response for existing callers', async () => {
  all.mockResolvedValue([{ slug: 'old-client' }])
  expect(await (await GET(new NextRequest('http://localhost/api/posts/public'))).json()).toEqual([{ slug: 'old-client' }])
  expect(paginated).not.toHaveBeenCalled()
})
it('uses database pagination for bounded search recommendations', async () => {
  paginated.mockResolvedValue({ posts: [{ slug: 'latest' }], total: 115 })
  expect(await (await GET(new NextRequest('http://localhost/api/posts/public?limit=4'))).json()).toEqual([{ slug: 'latest' }])
  expect(paginated).toHaveBeenCalledWith(1, 4)
  expect(all).not.toHaveBeenCalled()
})
it.each(['0', '51', '-4', 'NaN', '4oops'])('rejects unsafe limit %s', async limit => {
  expect((await GET(new NextRequest(`http://localhost/api/posts/public?limit=${limit}`))).status).toBe(400)
  expect(all).not.toHaveBeenCalled()
  expect(paginated).not.toHaveBeenCalled()
})
