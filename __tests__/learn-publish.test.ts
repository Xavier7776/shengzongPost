import { beforeEach, describe, expect, it, vi } from 'vitest'
import { makeEdition } from './fixtures/learn-edition'
const { sql, revalidate } = vi.hoisted(() => ({ sql: vi.fn(), revalidate: vi.fn() }))
vi.mock('@/lib/db/_core', () => ({ sql }))
vi.mock('next/cache', () => ({ revalidatePath: revalidate }))
import { publishEdition } from '@/lib/learn/publish'

beforeEach(() => { sql.mockReset(); revalidate.mockReset() })
describe('learn publication result handling', () => {
  it('validates again before any database mutation', async () => {
    await expect(publishEdition({ ...makeEdition(), blocks: [] })).rejects.toThrow('quality gate rejected')
    expect(sql).not.toHaveBeenCalled()
  })
  it('invalidates public pages only after a successful insert', async () => {
    sql.mockResolvedValue([{ inserted: 1 }])
    await expect(publishEdition(makeEdition())).resolves.toEqual({ created: true, slug: 'daily-learn-2026-10-08' })
    expect(revalidate.mock.calls).toEqual([['/blog'], ['/learn'], ['/blog/daily-learn-2026-10-08']])
  })
  it('accepts an existing published edition as an idempotent retry', async () => {
    sql.mockResolvedValueOnce([{ inserted: 0 }]).mockResolvedValueOnce([{ post_id: 1 }])
    await expect(publishEdition(makeEdition())).resolves.toEqual({ created: false, slug: 'daily-learn-2026-10-08' })
    expect(revalidate).not.toHaveBeenCalled()
  })
  it('does not report publication or invalidate pages after a database conflict', async () => {
    sql.mockRejectedValue(new Error('unique edition date conflict'))
    await expect(publishEdition(makeEdition())).rejects.toThrow('unique edition date conflict')
    expect(sql).toHaveBeenCalledOnce()
    expect(revalidate).not.toHaveBeenCalled()
  })
})
