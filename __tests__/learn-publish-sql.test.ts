// @vitest-environment node
import { PGlite } from '@electric-sql/pglite'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { makeEdition } from './fixtures/learn-edition'
const { sql } = vi.hoisted(() => ({sql:vi.fn()}))
vi.mock('@/lib/db/_core', () => ({sql}))
vi.mock('next/cache', () => ({revalidatePath:vi.fn()}))
import { publishEdition } from '@/lib/learn/publish'
const db = new PGlite()
beforeAll(async () => {
  await db.exec(`CREATE TABLE users(id int PRIMARY KEY,role text);
    INSERT INTO users VALUES (1,'admin');
    CREATE TABLE posts(id serial PRIMARY KEY,slug text UNIQUE,title text,excerpt text,content text,
      tags text[],published boolean,author_id int REFERENCES users(id));
    CREATE TABLE learn_editions(post_id int PRIMARY KEY REFERENCES posts(id) ON DELETE CASCADE,
      edition_date date UNIQUE,topic text,document jsonb,status text DEFAULT 'published');`)
  sql.mockImplementation(async (strings:TemplateStringsArray,...values:unknown[]) => {
    const query = strings.reduce((text,part,i) => text + (i ? '$'+i : '') + part,'')
    return (await db.query(query,values)).rows
  })
},30000)
beforeEach(async () => {
  await db.exec('TRUNCATE learn_editions,posts RESTART IDENTITY')
  vi.stubGlobal('fetch', vi.fn(async (url:string) => new Response(url.includes('/blog/')?'cached':'source',{status:200})))
})
afterEach(() => vi.unstubAllGlobals())
afterAll(() => db.close())

describe('publication on the PostgreSQL engine', () => {
  it('creates one pair under concurrent retries and rejects different content', async () => {
    const edition = makeEdition()
    const results = await Promise.all([publishEdition(edition),publishEdition(edition)])
    expect(results.filter(r=>r.created)).toHaveLength(1)
    expect(results.every(r=>r.verified)).toBe(true)
    expect((await db.query('SELECT COUNT(*)::int AS count FROM posts')).rows).toEqual([{count:1}])
    expect((await db.query('SELECT COUNT(*)::int AS count FROM learn_editions')).rows).toEqual([{count:1}])
    await expect(publishEdition({...edition,title:edition.title+' changed'})).rejects.toMatchObject({category:'conflict'})
    expect((await db.query('SELECT title FROM posts')).rows).toEqual([{title:edition.title}])
  })
  it('detects orphan and manually edited records without fixing or overwriting them', async () => {
    const edition = makeEdition()
    await db.query('INSERT INTO posts(slug,title,published) VALUES($1,$2,true)',['daily-learn-'+edition.date,'manual article'])
    await expect(publishEdition(edition)).rejects.toMatchObject({category:'conflict'})
    expect((await db.query('SELECT title FROM posts')).rows).toEqual([{title:'manual article'}])
    expect((await db.query('SELECT COUNT(*)::int AS count FROM learn_editions')).rows).toEqual([{count:0}])
  })
  it('rolls back the post when the edition insert fails', async () => {
    await db.exec("ALTER TABLE learn_editions ADD CONSTRAINT simulated_failure CHECK(topic <> 'agent')")
    try {
      await expect(publishEdition(makeEdition())).rejects.toThrow()
      expect((await db.query('SELECT COUNT(*)::int AS count FROM posts')).rows).toEqual([{count:0}])
    } finally { await db.exec('ALTER TABLE learn_editions DROP CONSTRAINT simulated_failure') }
  })
})
