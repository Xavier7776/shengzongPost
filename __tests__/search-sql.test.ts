// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { PGlite } from '@electric-sql/pglite'
import { NextRequest } from 'next/server'
const { sql } = vi.hoisted(() => ({ sql: vi.fn() }))
vi.mock('@/lib/db/_core', () => ({ sql }))
import { searchAll } from '@/lib/db-search'
import { parseSearchParams } from '@/lib/search'
import { GET } from '@/app/api/search/route'

const db = new PGlite()
const search = (q: string, rest = '') => searchAll(parseSearchParams(new URLSearchParams(`q=${encodeURIComponent(q)}&${rest}`)))

beforeAll(async () => {
  await db.exec(`
    CREATE TABLE users (id int PRIMARY KEY, name text);
    CREATE TABLE posts (id serial PRIMARY KEY, slug text UNIQUE, title text, excerpt text, content text,
      tags text[], cover_image text, author_id int, published boolean, created_at timestamptz);
    CREATE TABLE skills (slug text UNIQUE, name text, description text, chinese_summary text, content text,
      tags text[], cover_image text, category text, created_at timestamptz);
    CREATE TABLE gallery_images (id serial PRIMARY KEY, title text, description text, category text, tags text[], url text, created_at timestamptz);
    INSERT INTO posts (slug,title,published,created_at) SELECT 'page-'||i,'pagekey',true,'2026-01-01' FROM generate_series(1,40) i;
    INSERT INTO posts (slug,title,content,published,created_at) VALUES
      ('draft','pagekey rankkey hiddenkey','hiddenkey',false,'2026-10-09'),
      ('body','Old article','rankkey 老文章专用词',true,'2026-09-01');
    INSERT INTO posts (slug,title,excerpt,tags,published,created_at) VALUES
      ('post-title','a rankkey title','rankkey',ARRAY['rankkey'],true,'2026-09-01'),
      ('tag','Tagged article','',ARRAY['rankkey'],true,'2026-09-01'),
      ('excerpt','Excerpt article','rankkey',NULL,true,'2026-09-01');
    INSERT INTO skills (slug,name,created_at) SELECT 'page-'||i,'pagekey','2026-01-01' FROM generate_series(1,20) i;
    INSERT INTO skills (slug,name,content,created_at) VALUES
      ('skill-title','rankkey','', '2025-01-01'),('skill-body','skill body','skillbodyonly','2026-09-01');
    INSERT INTO gallery_images (title,description,category,created_at) SELECT 'pagekey','','','2026-01-01' FROM generate_series(1,5);
    INSERT INTO gallery_images (title,description,category,created_at) VALUES
      ('rankkey gallery','','','2026-09-01'),('artwork','gallerydescriptiononly','','2026-09-01');
  `)
  sql.mockImplementation(async (strings: TemplateStringsArray, ...values: unknown[]) => {
    const text = strings.reduce((query, part, i) => query + (i ? `$${i}` : '') + part, '')
    return (await db.query(text, values)).rows
  })
}, 30000)
afterAll(() => db.close())

describe('search on the PostgreSQL engine', () => {
  it('ranks across types by the strongest field, with exact titles above newer body matches', async () => {
    const result = await search('rankkey')
    expect(result.results.map(r => r.id)).toEqual(['skill-title', '6', 'post-title', 'tag', 'excerpt', 'body'])
    expect(result.counts).toEqual({ all: 6, post: 4, skill: 1, gallery: 1 })
    expect(result.results.every(r => !('body' in r) && !('content' in r) && !('score' in r))).toBe(true)
    expect((await search('rankkey', 'sort=newest')).results.at(-1)?.id).toBe('skill-title')
  })

  it('returns all 65 matches exactly once across pages, including ties', async () => {
    const pages = await Promise.all([1, 2, 3, 4].map(page => search('pagekey', `page=${page}`)))
    expect(pages.map(p => p.results.length)).toEqual([20, 20, 20, 5])
    for (const p of pages) {
      expect(p.total).toBe(65)
      expect(p.totalPages).toBe(4)
      expect(p.counts).toEqual({ all: 65, post: 40, skill: 20, gallery: 5 })
    }
    const keys = pages.flatMap(p => p.results.map(r => `${r.type}:${r.id}`))
    expect(new Set(keys).size).toBe(65)
    expect((await search('pagekey', 'pageSize=1')).counts).toEqual(pages[0].counts)
    const beyond = await search('pagekey', 'page=5')
    expect(beyond.results).toEqual([])
    expect(beyond.total).toBe(65)
  })

  it('filters in SQL while preserving global facets, and excludes drafts from both', async () => {
    const result = await search('pagekey', 'type=post&page=2&pageSize=20')
    expect(result.total).toBe(40)
    expect(result.results).toHaveLength(20)
    expect(result.results.every(r => r.type === 'post')).toBe(true)
    expect(result.counts.all).toBe(65)
    expect((await search('hiddenkey')).counts.all).toBe(0)
    expect((await search('老文章专用词')).results.map(r => r.id)).toEqual(['body'])
    expect((await search('skillbodyonly')).results.map(r => r.id)).toEqual(['skill-body'])
    expect((await search('gallerydescriptiononly')).results).toHaveLength(1)
  })

  it.each(['%', '_', '\\', "' OR TRUE --", '中文', '✨', '[a]+', '100%_\\'])('treats %s as literal parameterized text', async term => {
    const slug = `literal-${term}`
    await db.query('INSERT INTO posts (slug,title,published) VALUES ($1,$2,true)', [slug, `Literal ${term}`])
    expect((await search(term)).results.map(r => r.id)).toEqual([slug])
    await db.query('DELETE FROM posts WHERE slug=$1', [slug])
  })

  it('does not query for empty input', async () => {
    sql.mockClear()
    expect((await search('  ')).counts.all).toBe(0)
    expect(sql).not.toHaveBeenCalled()
  })

  it('keeps true API totals and facet counts', async () => {
    const response = await GET(new NextRequest('http://localhost/api/search?q=pagekey&type=post&page=2'))
    expect(response.status).toBe(200)
    expect(response.headers.get('server-timing')).toMatch(/^search;dur=\d+\.\d$/)
    expect(await response.json()).toMatchObject({ q: 'pagekey', page: 2, total: 40, totalPages: 2, counts: { all: 65 } })
  })

  it('preserves the legacy API limit alias without limiting totals or facets', async () => {
    const response = await GET(new NextRequest('http://localhost/api/search?q=pagekey&limit=4'))
    const result = await response.json()
    expect(response.status).toBe(200)
    expect(result).toMatchObject({ pageSize: 4, total: 65, totalPages: 17, counts: { all: 65 } })
    expect(result.results).toHaveLength(4)
  })

  it.each(['q=' + 'a'.repeat(121), 'q=%00', 'page=0', 'page=-1', 'page=1.2', 'page=2oops',
    'page=9007199254740992', 'pageSize=0', 'pageSize=51', 'sort=stars', 'type=blog'])('rejects invalid parameters: %s', async params => {
    sql.mockClear()
    const response = await GET(new NextRequest(`http://localhost/api/search?${params}`))
    expect(response.status).toBe(400)
    expect(sql).not.toHaveBeenCalled()
  })

  it('reports database errors as 500 instead of empty results', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {})
    sql.mockRejectedValueOnce(new Error('database down'))
    const response = await GET(new NextRequest('http://localhost/api/search?q=pagekey'))
    expect(response.status).toBe(500)
    expect(response.headers.has('server-timing')).toBe(false)
    expect(await response.json()).not.toHaveProperty('total')
    log.mockRestore()
  })
})
