import { beforeEach, describe, expect, it, vi } from 'vitest'
const { sql } = vi.hoisted(() => ({ sql: vi.fn() }))
vi.mock('@/lib/db/_core', () => ({
  sql,
  serializeRows: (rows: Record<string, unknown>[]) => rows.map(r => ({ ...r })),
  serializeRow: (row: Record<string, unknown>) => row,
}))
import { getApprovedComments } from '@/lib/db/comments'

beforeEach(() => sql.mockReset().mockResolvedValue([]))

describe('Neon comment query SQL regression', () => {
  it('issues one plain tagged query for anonymous readers', async () => {
    expect(await getApprovedComments('hello')).toEqual([])
    expect(sql).toHaveBeenCalledOnce()
    const [strings, userId, slug] = sql.mock.calls[0]
    expect(strings.join('?')).toContain('EXISTS(SELECT 1 FROM comment_likes cl2')
    expect(strings.join('?')).toContain("c.status='approved'")
    expect(userId).toBe(-1)
    expect(slug).toBe('hello')
  })
  it('binds logged-in user ID without nested tagged SQL and preserves threaded replies', async () => {
    sql.mockResolvedValue([
      { id: 10, content: 'Root', parent_id: null, user_liked: true },
      { id: 11, content: 'Reply', parent_id: 10, user_liked: false },
    ])
    const roots = await getApprovedComments('hello', 7)
    expect(roots).toHaveLength(1)
    expect(roots[0].userLiked).toBe(true)
    expect(roots[0].replies).toHaveLength(1)
    expect(roots[0].replies?.[0].userLiked).toBe(false)
    expect(sql.mock.calls[0][1]).toBe(7)
    expect(Object.prototype.hasOwnProperty.call(roots[0], 'user_liked')).toBe(false)
  })
})
