import { PGlite } from '@electric-sql/pglite'
import { readFileSync, writeFileSync } from 'node:fs'
import { beforeAll, beforeEach, afterAll, describe, expect, it, vi } from 'vitest'

const { sql } = vi.hoisted(() => ({ sql: Object.assign(vi.fn(), { transaction: vi.fn() }) }))
vi.mock('@/lib/db/_core', () => ({ sql, serializeRow: (r: unknown) => r, serializeRows: (r: unknown) => r }))
import { purchaseFrame, purchaseCursorEffect } from '@/lib/db/shop'
import { addPoints, hasPointTransaction, rewardPostRead, chargeResearch } from '@/lib/db/points'
import { toggleBookmark, getUserBookmarks } from '@/lib/db/social'
import { toggleReaction, updateCommentStatus } from '@/lib/db/comments'
import { incrementViewCount } from '@/lib/db/posts'

type Query = { query: string; params: unknown[] }
const db = new PGlite()
const schema = readFileSync('__tests__/fixtures/points-schema.sql','utf8')
const captured: Record<string, Query[]> = {}
let lastQueries: Query[] = []
const query = (strings: TemplateStringsArray, ...params: unknown[]): Query => ({
  query: strings.reduce((s, part, i) => s+part+(i<params.length?'$'+(i+1):''), ''), params,
})
beforeAll(async () => { await db.exec(schema) })
beforeEach(async () => {
  await db.exec('TRUNCATE point_transactions,user_frames,user_cursor_effects,bookmarks,post_reactions,point_read_log; UPDATE users SET points=CASE WHEN id=7 THEN 100 ELSE 4000 END; UPDATE comments SET status=\'pending\'')
  sql.mockImplementation(async (strings: TemplateStringsArray,...params: unknown[]) => {
    const q = query(strings,...params); return (await db.query(q.query,q.params)).rows
  })
  sql.transaction.mockImplementation(async (build: (tx: typeof query) => Query[]) => {
    lastQueries = build(query)
    return db.transaction(async tx => {
      const result = []
      for (const q of lastQueries) result.push((await tx.query(q.query,q.params)).rows)
      return result
    })
  })
})
afterAll(async () => {
  if (process.env.M10_SQL_CAPTURE) writeFileSync(process.env.M10_SQL_CAPTURE, JSON.stringify({schema,captured},null,2))
  await db.close()
})
async function balance(id = 7) { return (await db.query<{points:number}>('SELECT points FROM users WHERE id=$1',[id])).rows[0].points }
async function ledger() { return (await db.query<{amount:number;reason:string}>('SELECT amount,reason FROM point_transactions ORDER BY id')).rows }

describe('atomic account balances, ledger and entitlements', () => {
  it('charges a frame once, preserves replay and rejects a different unaffordable purchase', async () => {
    expect(await purchaseFrame(7,1)).toMatchObject({remainingPoints:40,frame:{id:1}})
    captured.frame = lastQueries
    expect(await purchaseFrame(7,1)).toMatchObject({remainingPoints:40})
    await expect(purchaseFrame(7,2)).rejects.toThrow('Insufficient points')
    captured.otherFrame = lastQueries
    expect(await ledger()).toEqual([{amount:-60,reason:'frame_purchase'}])
    expect((await db.query('SELECT * FROM user_frames')).rows).toHaveLength(1)
  })
  it('shares the balance across frame/cursor purchases and supports free items', async () => {
    await purchaseCursorEffect(7,1); captured.cursor = lastQueries
    await purchaseCursorEffect(7,1)
    await expect(purchaseFrame(7,1)).rejects.toThrow('Insufficient points')
    await purchaseFrame(7,6)
    expect(await balance()).toBe(40)
    expect(await ledger()).toEqual([{amount:-60,reason:'cursor_purchase'},{amount:0,reason:'frame_purchase'}])
  })
  it('rolls back balance and ownership when ledger insertion fails', async () => {
    await expect(purchaseFrame(7,3)).rejects.toThrow(); captured.failedFrame = lastQueries
    expect(await balance()).toBe(100)
    expect((await db.query('SELECT * FROM user_frames')).rows).toHaveLength(0)
    expect(await ledger()).toHaveLength(0)
  })
  it('recovers a previously paid entitlement without another charge and respects existing ownership', async () => {
    await db.exec("UPDATE users SET points=40 WHERE id=7; INSERT INTO point_transactions(user_id,amount,reason,ref_slug) VALUES(7,-60,'frame_purchase','frame_one')")
    await purchaseFrame(7,1)
    expect((await db.query('SELECT * FROM user_frames')).rows).toHaveLength(1)
    expect(await balance()).toBe(40)
    expect(await ledger()).toHaveLength(1)
    await db.exec('INSERT INTO user_frames VALUES(7,2)')
    await purchaseFrame(7,2)
    expect(await balance()).toBe(40)
  })
  it('rejects absent, disabled or negative priced products without writing', async () => {
    for (const id of [4,5,999]) await expect(purchaseFrame(7,id)).rejects.toThrow('Frame not found')
    await expect(purchaseCursorEffect(7,999)).rejects.toThrow('Cursor effect not found')
    expect(await balance()).toBe(100)
    expect(await ledger()).toHaveLength(0)
  })
  it('logs the actual clipped deduction and rolls back ordinary balance changes on audit failure', async () => {
    expect(await addPoints(7,-150,'deduct')).toBe(0)
    expect(await hasPointTransaction(7,'deduct')).toBe(true)
    expect(await ledger()).toEqual([{amount:-100,reason:'deduct'}])
    await expect(addPoints(7,10,'test','bad')).rejects.toThrow()
    expect(await balance()).toBe(0)
  })
  it('rewards and claws back a bookmark at most once across repeated toggles', async () => {
    expect(await toggleBookmark('public',7)).toBe(true); captured.bookmark = lastQueries
    expect(await toggleBookmark('public',7)).toBe(false)
    expect(await toggleBookmark('public',7)).toBe(true)
    expect(await toggleBookmark('public',7)).toBe(false)
    expect(await balance()).toBe(100)
    expect(await ledger()).toEqual([{amount:1,reason:'bookmark_post'},{amount:-1,reason:'unbookmark_post'}])
  })
  it('records a zero clawback when the bonus was spent, never repeatedly penalizes', async () => {
    await toggleBookmark('public',7)
    await db.exec('UPDATE users SET points=0 WHERE id=7')
    await toggleBookmark('public',7); await toggleBookmark('public',7); await toggleBookmark('public',7)
    expect(await balance()).toBe(0)
    expect(await ledger()).toEqual([{amount:1,reason:'bookmark_post'},{amount:0,reason:'unbookmark_post'}])
  })
  it('keeps reaction toggle/switch semantics while bounding rewards', async () => {
    await toggleReaction('public',7,'like'); captured.like = lastQueries
    await toggleReaction('public',7,'dislike')
    await toggleReaction('public',7,'like')
    await toggleReaction('public',7,'like')
    expect((await db.query('SELECT * FROM post_reactions')).rows).toHaveLength(0)
    expect(await balance()).toBe(100)
    expect(await ledger()).toEqual([{amount:1,reason:'like_post'},{amount:-1,reason:'unlike_post'}])
  })
  it('rolls back bookmarks, reactions, read marks and moderation together with failed rewards', async () => {
    await expect(toggleBookmark('bad',7)).rejects.toThrow()
    await expect(toggleReaction('bad',7,'like')).rejects.toThrow()
    await expect(rewardPostRead(7,'bad')).rejects.toThrow()
    await expect(updateCommentStatus(4,'approved')).rejects.toThrow()
    expect((await db.query('SELECT * FROM bookmarks UNION ALL SELECT id,post_slug,user_id,NOW() FROM post_reactions')).rows).toHaveLength(0)
    expect((await db.query('SELECT * FROM point_read_log')).rows).toHaveLength(0)
    expect((await db.query<{status:string}>('SELECT status FROM comments WHERE id=4')).rows[0].status).toBe('pending')
    expect(await balance()).toBe(100)
  })
  it('only rewards published posts, hides withdrawn bookmarks and preserves legacy read marks', async () => {
    for (const slug of ['draft','missing']) {
      await expect(toggleBookmark(slug,7)).rejects.toThrow('Post not found')
      await expect(toggleReaction(slug,7,'like')).rejects.toThrow('Post not found')
      expect(await rewardPostRead(7,slug)).toBe(false)
      await incrementViewCount(slug)
    }
    await db.exec("INSERT INTO point_read_log VALUES(7,'public')")
    expect(await rewardPostRead(7,'public')).toBe(false)
    expect(await rewardPostRead(8,'public')).toBe(true); captured.read = lastQueries
    expect(await rewardPostRead(8,'public')).toBe(false)
    await db.exec("INSERT INTO bookmarks(post_slug,user_id) VALUES('draft',7)")
    expect(await getUserBookmarks(7)).toHaveLength(0)
    expect(await balance(8)).toBe(4002)
  })
  it('moderates and rewards once per account/post, without re-rewarding old approvals', async () => {
    await updateCommentStatus(1,'approved'); captured.approve = lastQueries
    await updateCommentStatus(2,'approved')
    await updateCommentStatus(1,'rejected'); await updateCommentStatus(1,'approved')
    await updateCommentStatus(3,'approved')
    await expect(updateCommentStatus(999,'approved')).rejects.toThrow('Comment not found')
    expect(await balance()).toBe(105)
    expect(await ledger()).toEqual([{amount:5,reason:'comment_approved'}])
    await db.exec("DELETE FROM point_transactions; UPDATE comments SET status='approved' WHERE id=1")
    await updateCommentStatus(1,'approved')
    expect(await balance()).toBe(105)
  })
  it('charges a research request once and uses account-bound keys; insufficient funds do not create ledger', async () => {
    const requestId='00000000-0000-4000-8000-000000000001'
    const a=await chargeResearch(8,requestId,2000); captured.research = lastQueries
    expect(a).toMatchObject({paid:true,remaining:2000})
    expect(await chargeResearch(8,requestId,2000)).toEqual(a)
    expect(await chargeResearch(7,requestId,2000)).toMatchObject({paid:false,remaining:100})
    expect(await chargeResearch(8,'00000000-0000-4000-8000-000000000002',2000)).toMatchObject({paid:true,remaining:0})
    expect(await chargeResearch(8,'00000000-0000-4000-8000-000000000003',2000)).toMatchObject({paid:false,remaining:0})
    expect(await ledger()).toEqual([{amount:-2000,reason:'deep_research'},{amount:-2000,reason:'deep_research'}])
  })
  it('rolls back research charges on ledger errors', async () => {
    await expect(chargeResearch(8,'00000000-0000-4000-8000-000000000099',2000)).rejects.toThrow()
    expect(await balance(8)).toBe(4000)
    expect(await ledger()).toHaveLength(0)
  })
})
