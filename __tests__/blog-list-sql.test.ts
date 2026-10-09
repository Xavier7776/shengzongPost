import { beforeEach, describe, expect, it, vi } from 'vitest'
const { sql } = vi.hoisted(() => ({ sql:vi.fn() }))
vi.mock('@/lib/db/_core', () => ({
  sql,
  serializeRows: (rows: Record<string,unknown>[])=>rows.map(row=>({...row})),
  serializeRow: (row: Record<string,unknown>)=>row,
}))
import { getBlogTagCounts, getPopularPosts, getPostsPaginatedByTag } from '@/lib/db/posts'

beforeEach(() => sql.mockReset())

describe('global blog categorization and popularity', () => {
  it('ranks articles using stored cumulative views, never arbitrary page positions', async () => {
    sql.mockResolvedValue([{slug:'high-traffic',title:'Most viewed'}])
    const result = await getPopularPosts(5)
    expect(result[0].slug).toBe('high-traffic')
    const query = (sql.mock.calls[0][0] as TemplateStringsArray).join('?')
    expect(query).toMatch(/WHERE p\.published=TRUE/)
    expect(query).toMatch(/ORDER BY COALESCE\(p\.view_count,0\) DESC/)
    expect(sql.mock.calls[0][1]).toBe(5)
  })
  it('returns actual global tag counts for published articles only', async () => {
    sql.mockResolvedValue([{tag:'RAG',count:7},{tag:'Agent',count:5}])
    expect(await getBlogTagCounts()).toEqual([{tag:'RAG',count:7},{tag:'Agent',count:5}])
    const query = (sql.mock.calls[0][0] as TemplateStringsArray).join('?')
    expect(query).toContain('COUNT(DISTINCT p.id)::int')
    expect(query).toContain('p.published=TRUE')
  })
  it('paginates matching tags across all published posts', async () => {
    sql.mockResolvedValueOnce([{total:27}]).mockResolvedValueOnce([{slug:'old-post',tags:['RAG']}])
    const response = await getPostsPaginatedByTag(3,12,'RAG')
    expect(response.total).toBe(27)
    expect(response.posts.map(p=>p.slug)).toEqual(['old-post'])
    const countText = (sql.mock.calls[0][0] as TemplateStringsArray).join('?')
    const postsText = (sql.mock.calls[1][0] as TemplateStringsArray).join('?')
    expect(countText).toContain('published=TRUE')
    expect(postsText).toContain('p.published=TRUE')
    expect(sql.mock.calls[0][1]).toBe('RAG')
    expect(sql.mock.calls[1].slice(1)).toEqual(['RAG',12,24])
  })
})
