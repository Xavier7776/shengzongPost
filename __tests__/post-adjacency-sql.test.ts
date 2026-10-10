import { PGlite } from '@electric-sql/pglite'
import { beforeAll, beforeEach, afterAll, describe, expect, it, vi } from 'vitest'
const { sql } = vi.hoisted(() => ({ sql: vi.fn() }))
vi.mock('@/lib/db/_core', () => ({ sql, serializeRow: (row: unknown) => row, serializeRows: (rows: unknown) => rows }))
import { getAdjacentPosts } from '@/lib/db/posts'
const db = new PGlite()
beforeAll(async () => {
  await db.exec(`CREATE TABLE users(id int,name text,avatar text);
    CREATE TABLE posts(id int PRIMARY KEY,slug text,title text,excerpt text,tags text[],created_at timestamptz,cover_image text,author_id int,published boolean);
    INSERT INTO posts(id,slug,title,created_at,published) VALUES
    (90,'backfilled-old','Old','2026-07-01',true),(9,'same-time-earlier','Tie earlier','2026-08-01',true),
    (10,'anchor','Anchor','2026-08-01',true),(11,'same-time-later','Tie later','2026-08-01',true),
    (1,'newer-small-id','New','2026-09-01',true),(95,'draft-near','Draft','2026-07-31',false)`)
})
beforeEach(() => {
  sql.mockReset().mockImplementation(async (strings: TemplateStringsArray, ...params: unknown[]) => {
    const text = strings.reduce((s, part, i) => s+part+(i<params.length?'$'+(i+1):''), '')
    return db.transaction(async tx => { await tx.exec('SET TRANSACTION READ ONLY'); return (await tx.query(text, params)).rows })
  })
})
afterAll(() => db.close())
describe('publication-time neighbor navigation on real PostgreSQL', () => {
  it('orders by publication time with a deterministic ID tie break, ignoring drafts and insertion order', async () => {
    const result = await getAdjacentPosts('anchor')
    expect(result.prev?.slug).toBe('same-time-earlier')
    expect(result.next?.slug).toBe('same-time-later')
    expect(result.prev).not.toHaveProperty('direction')
    expect(sql).toHaveBeenCalledOnce()
    expect((await getAdjacentPosts('backfilled-old')).next?.slug).toBe('same-time-earlier')
    expect((await getAdjacentPosts('same-time-later')).next?.slug).toBe('newer-small-id')
  })
  it('does not wrap boundaries and exposes no neighbors for missing or unpublished sources', async () => {
    expect((await getAdjacentPosts('backfilled-old')).prev).toBeNull()
    expect((await getAdjacentPosts('newer-small-id')).next).toBeNull()
    expect(await getAdjacentPosts('missing')).toEqual({ prev: null, next: null })
    expect(await getAdjacentPosts('draft-near')).toEqual({ prev: null, next: null })
  })
})
