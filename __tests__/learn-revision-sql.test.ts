// @vitest-environment node
import { PGlite } from '@electric-sql/pglite'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { makeEdition } from './fixtures/learn-edition'
import { makeEditionV2 } from './fixtures/learn-edition-v2'
const {sql}=vi.hoisted(()=>({sql:vi.fn()}))
vi.mock('@/lib/db/_core',()=>({sql,serializeRow:(row:Record<string,unknown>)=>row}))
vi.mock('next/cache',()=>({revalidatePath:vi.fn(),revalidateTag:vi.fn()}))
import { publishEdition, reviseEdition } from '@/lib/learn/publish'
import { editionFingerprint, textVersion } from '@/lib/learn/publication-contract'
import { updatePost } from '@/lib/db/posts'
import { EditionEditConflict } from '@/lib/learn/edit-conflict'
const db=new PGlite()
const old=makeEdition(),fingerprint=editionFingerprint(old)
function correction() {return {...makeEditionV2(),revisions:[{number:1,correctedAt:'2026-10-08T03:00:00Z',summary:'Add precise evidence and chart provenance',previousFingerprint:fingerprint}]}}
beforeAll(async()=>{
  await db.exec(`CREATE TABLE users(id int PRIMARY KEY,role text); INSERT INTO users VALUES(1,'admin');
    CREATE TABLE posts(id serial PRIMARY KEY,slug text UNIQUE,title text,excerpt text,content text,tags text[],published boolean,author_id int,
      updated_at timestamptz DEFAULT now(),cover_image text,attachments jsonb DEFAULT '[]');
    CREATE TABLE learn_editions(post_id int PRIMARY KEY REFERENCES posts(id) ON DELETE CASCADE,edition_date date UNIQUE,topic text,document jsonb,status text DEFAULT 'published');`)
  sql.mockImplementation(async(strings:TemplateStringsArray,...values:unknown[])=>{
    const query=strings.reduce((out,part,i)=>out+(i?'$'+i:'')+part,'')
    return (await db.query(query,values)).rows
  })
},30000)
beforeEach(async()=>{
  await db.exec('TRUNCATE learn_editions,posts RESTART IDENTITY')
  vi.stubGlobal('fetch',vi.fn(async()=>new Response('source',{status:200})))
  await publishEdition(old)
  sql.mockClear()
})
afterEach(()=>vi.unstubAllGlobals())
afterAll(()=>db.close())
describe('reviewed edition correction on the PostgreSQL engine',()=>{
  it('updates JSON and indexed body atomically, records the old fingerprint, and retries read-only',async()=>{
    const e=correction()
    expect(await reviseEdition(e,fingerprint)).toMatchObject({updated:true,dbStatus:'db_ready'})
    const rows=(await db.query('SELECT p.content,l.document FROM posts p JOIN learn_editions l ON l.post_id=p.id')).rows
    expect(rows).toEqual([{content:textVersion(e),document:e}])
    sql.mockClear()
    expect(await reviseEdition(e,fingerprint)).toMatchObject({updated:false,alreadyExists:true,cacheStatus:'unchanged'})
    expect(sql.mock.calls).toHaveLength(1)
  })
  it('rejects stale revisions and altered history without overwriting either representation',async()=>{
    const e=correction()
    await expect(reviseEdition(e,'a'.repeat(64))).rejects.toMatchObject({category:'conflict'})
    e.revisions[0].previousFingerprint='b'.repeat(64)
    await expect(reviseEdition(e,fingerprint)).rejects.toMatchObject({category:'conflict'})
    expect((await db.query('SELECT document FROM learn_editions')).rows).toEqual([{document:old}])
  })
  it('admits one competing correction and preserves a complete winning pair',async()=>{
    const a=correction(),b={...correction(),title:old.title+' · 更正'}
    const results=await Promise.allSettled([reviseEdition(a,fingerprint),reviseEdition(b,fingerprint)])
    expect(results.filter(r=>r.status==='fulfilled')).toHaveLength(1)
    const row=(await db.query<{title:string;content:string;document:typeof a}>('SELECT p.title,p.content,l.document FROM posts p JOIN learn_editions l ON l.post_id=p.id')).rows[0]
    expect(row.title).toBe((row.document as typeof a).title)
    expect(row.content).toBe(textVersion(row.document as typeof a))
  })
  it('rolls back both changes if the edition update fails',async()=>{
    await db.exec("ALTER TABLE learn_editions ADD CONSTRAINT simulate_revision_failure CHECK((document->>'version')::int=1)")
    try {
      await expect(reviseEdition(correction(),fingerprint)).rejects.toThrow()
      expect((await db.query('SELECT p.content,l.document FROM posts p JOIN learn_editions l ON l.post_id=p.id')).rows).toEqual([{content:textVersion(old),document:old}])
    } finally {await db.exec('ALTER TABLE learn_editions DROP CONSTRAINT simulate_revision_failure')}
  })
  it('blocks ordinary edits and slug/tag drift, while preserving withdrawal and cover changes',async()=>{
    const slug='daily-learn-'+old.date
    for(const data of [{content:'<p>unrecorded correction</p>'},{slug:'moved'},{title:'changed'},{tags:['changed']}])
      await expect(updatePost(slug,data)).rejects.toBeInstanceOf(EditionEditConflict)
    expect(await updatePost(slug,{published:false,cover_image:'https://example.invalid/cover',attachments:[]})).toMatchObject({published:false,content:textVersion(old)})
    expect(await updatePost(slug,{published:true})).toMatchObject({published:true})
    await db.query('INSERT INTO posts(slug,title,content,published) VALUES($1,$2,$3,true)',['ordinary','Old','<p>Old</p>'])
    expect(await updatePost('ordinary',{title:'New',content:'<script>bad()</script><p>New</p>'})).toMatchObject({title:'New',content:'<p>New</p>'})
  })
  it('keeps failed source checks read-only',async()=>{
    vi.stubGlobal('fetch',vi.fn(async()=>new Response('gone',{status:404})))
    await expect(reviseEdition(correction(),fingerprint)).rejects.toMatchObject({category:'source_unverified',committed:false})
    expect((await db.query('SELECT document FROM learn_editions')).rows).toEqual([{document:old}])
  })
  it('recognizes a committed correction after a lost acknowledgement and transport retry',async()=>{
    const execute=sql.getMockImplementation()!,e=correction()
    sql.mockImplementationOnce(execute).mockImplementationOnce(async(strings,...values)=>{
      await execute(strings,...values)
      return execute(strings,...values)
    })
    expect(await reviseEdition(e,fingerprint)).toMatchObject({updated:false,alreadyExists:true,dbStatus:'db_ready',cacheStatus:'invalidated'})
    expect((await db.query('SELECT document FROM learn_editions')).rows).toEqual([{document:e}])
  })
})
