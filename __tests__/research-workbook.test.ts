// @vitest-environment node
import { PGlite } from '@electric-sql/pglite'
import { readFileSync } from 'node:fs'
import { NextRequest } from 'next/server'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

const { sql, session } = vi.hoisted(() => ({ sql: vi.fn(), session: vi.fn() }))
vi.mock('next-auth', () => ({ getServerSession: session }))
vi.mock('@/lib/authOptions', () => ({ authOptions: {} }))
vi.mock('@/lib/db/_core', () => ({ sql, serializeRow: (row: unknown) => row }))
import { GET, PUT } from '@/app/api/research/workbook/route'

const db = new PGlite()
const snapshot = {
  id: 'research', name: '资料比较', sheetOrder: ['sheet-1'],
  sheets: { 'sheet-1': { id: 'sheet-1', rowCount: 100, columnCount: 20, cellData: { 0: { 0: { v: '测试资料' }, 1: { f: '=1+2' } } } } },
}
const request = (body: unknown, origin = 'https://blog.test') => new NextRequest('https://blog.test/api/research/workbook', {
  method: 'PUT', headers: { origin, 'Content-Type': 'application/json' }, body: JSON.stringify(body),
})
beforeAll(async () => {
  await db.exec('CREATE TABLE users (id INTEGER PRIMARY KEY); INSERT INTO users VALUES (7), (8)')
  await db.exec(readFileSync('supabase/migrations/057_research_workbooks.sql', 'utf8'))
  sql.mockImplementation(async (strings: TemplateStringsArray, ...params: unknown[]) => {
    const query = strings.reduce((text, part, index) => text + part + (index < params.length ? `$${index + 1}` : ''), '')
    return (await db.query(query, params)).rows
  })
})
beforeEach(async () => {
  await db.exec('TRUNCATE research_workbooks')
  session.mockResolvedValue({ user: { id: '7' } })
})
afterAll(async () => { await db.close() })

describe('private research workbook persistence through the API and PostgreSQL', () => {
  it('restores cell content and formulas from a saved JSON snapshot', async () => {
    expect(await (await GET()).json()).toEqual({ workbook: null })
    const saved = await PUT(request({ snapshot, revision: 0 }))
    expect(saved.status).toBe(200)
    expect(saved.headers.get('cache-control')).toBe('private, no-store')
    expect(await saved.json()).toMatchObject({ workbook: { revision: 1 } })
    expect(await (await GET()).json()).toMatchObject({ workbook: { snapshot, revision: 1 } })
    const changed = structuredClone(snapshot)
    changed.sheets['sheet-1'].cellData[0][0].v = '更新后的资料'
    expect((await PUT(request({ snapshot: changed, revision: 1 }))).status).toBe(200)
    expect(await (await GET()).json()).toMatchObject({ workbook: { snapshot: changed, revision: 2 } })
  })

  it('isolates accounts and ignores user IDs in submitted data', async () => {
    await PUT(request({ snapshot, revision: 0, userId: 8 }))
    session.mockResolvedValue({ user: { id: '8' } })
    expect(await (await GET()).json()).toEqual({ workbook: null })
    expect((await PUT(request({ snapshot, revision: 1, userId: 7 }))).status).toBe(409)
    expect((await PUT(request({ snapshot, revision: 0 }))).status).toBe(200)
    expect((await db.query('SELECT user_id FROM research_workbooks ORDER BY user_id')).rows).toEqual([{ user_id: 7 }, { user_id: 8 }])
  })

  it('rejects simultaneous first saves and stale tab updates without losing the latest content', async () => {
    const first = await Promise.all([PUT(request({ snapshot, revision: 0 })), PUT(request({ snapshot, revision: 0 }))])
    expect(first.map(result => result.status).sort()).toEqual([200, 409])
    const updates = await Promise.all([PUT(request({ snapshot, revision: 1 })), PUT(request({ snapshot, revision: 1 }))])
    expect(updates.map(result => result.status).sort()).toEqual([200, 409])
    expect(await (await GET()).json()).toMatchObject({ workbook: { revision: 2, snapshot } })
  })

  it('rejects unsigned, cross-site, oversized and malformed writes', async () => {
    session.mockResolvedValue(null)
    expect((await GET()).status).toBe(401)
    expect((await PUT(request({ snapshot, revision: 0 }))).status).toBe(401)
    session.mockResolvedValue({ user: { id: '7' } })
    expect((await PUT(request({ snapshot, revision: 0 }, 'https://other.test'))).status).toBe(403)
    for (const body of [{ snapshot: {}, revision: 0 }, { snapshot, revision: -1 }, { snapshot, revision: '1' }, { snapshot: { ...snapshot, sheetOrder: ['missing'] }, revision: 0 }]) {
      expect((await PUT(request(body))).status).toBe(400)
    }
    expect((await PUT(request({ data: 'x'.repeat(4 * 1024 * 1024) }))).status).toBe(413)
    expect((await db.query('SELECT * FROM research_workbooks')).rows).toHaveLength(0)
  })
})
