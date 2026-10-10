import {PGlite} from '@electric-sql/pglite'
import {writeFileSync} from 'node:fs'
import {beforeAll,beforeEach,afterAll,describe,expect,it,vi} from 'vitest'
const {sql}=vi.hoisted(()=>({sql:Object.assign(vi.fn(),{transaction:vi.fn()})}))
vi.mock('@/lib/db/_core',()=>({sql,serializeRow:(r:unknown)=>r,serializeRows:(r:unknown)=>r}))
import {reviewEditRequest,createEditRequest} from '@/lib/db/editRequests'
import {EditionEditConflict} from '@/lib/learn/edit-conflict'
const db=new PGlite()
type Query={query:string;params:unknown[]}
const captured:Record<string,Query[]>={}
let lastQueries:Query[]=[]
const query=(strings:TemplateStringsArray,...params:unknown[]):Query=>({query:strings.reduce((s,p,i)=>s+p+(i<params.length?'$'+(i+1):''),''),params})
beforeAll(async()=>{
 await db.exec(`CREATE TABLE users(id int PRIMARY KEY,name text,avatar text);
 CREATE TABLE posts(id serial PRIMARY KEY,slug text UNIQUE,title text,excerpt text,content text,tags text[],published boolean,cover_image text,attachments jsonb,author_id int,updated_at timestamptz);
 CREATE TABLE learn_editions(post_id int PRIMARY KEY REFERENCES posts(id),document jsonb);
 CREATE TABLE post_edit_requests(id serial PRIMARY KEY,post_slug text,user_id int REFERENCES users(id),title text,excerpt text,content text,tags text[],cover_image text,status text DEFAULT 'pending',admin_note text,created_at timestamptz DEFAULT NOW(),reviewed_at timestamptz,
 CHECK(id<>4 OR status='pending'));
 INSERT INTO users VALUES(7,'User',NULL);`)
})
beforeEach(async()=>{
 await db.exec(`TRUNCATE learn_editions,posts,post_edit_requests RESTART IDENTITY;
 INSERT INTO posts(slug,title,excerpt,content,tags,published,cover_image,attachments) VALUES('public','Original','Old','<p>Old</p>',ARRAY['old'],true,'/old.png','[]'),('edition','Original','Old','<p>Old</p>',ARRAY['old'],true,'/old.png','[]');
 INSERT INTO learn_editions VALUES(2,'{}');
 INSERT INTO post_edit_requests(id,post_slug,user_id,title,excerpt,content,tags,cover_image,status) VALUES
 (1,'public',7,'New','New excerpt','<p>New</p><script>attack()</script>',ARRAY['new'],NULL,'pending'),
 (2,'__new__:draft',7,'Draft','Draft excerpt','<p>Draft</p>',ARRAY['new'],NULL,'pending'),
 (3,'edition',7,'New','New excerpt','<p>New</p>',ARRAY['new'],NULL,'pending'),
 (4,'public',7,'New','New excerpt','<p>New</p>',ARRAY['new'],NULL,'pending'),
 (5,'missing',7,'New','New excerpt','<p>New</p>',ARRAY['new'],NULL,'pending');`)
 await db.exec('UPDATE posts SET author_id=7')
 await db.exec("SELECT setval(pg_get_serial_sequence('post_edit_requests','id'),5)")
 sql.mockImplementation(async(strings:TemplateStringsArray,...params:unknown[])=>{const q=query(strings,...params);return(await db.query(q.query,q.params)).rows})
 sql.transaction.mockImplementation(async(build:(tx:typeof query)=>Query[])=>db.transaction(async tx=>{
  lastQueries=build(query)
  const results=[];for(const q of lastQueries)results.push((await tx.query(q.query,q.params)).rows);return results
 }))
})
afterAll(async()=>{if(process.env.M10_SQL_CAPTURE)writeFileSync(process.env.M10_SQL_CAPTURE,JSON.stringify(captured,null,2));await db.close()})
async function request(id:number){return(await db.query<{status:string;reviewed_at:unknown}>('SELECT status,reviewed_at FROM post_edit_requests WHERE id=$1',[id])).rows[0]}
async function post(slug='public'){return(await db.query<{title:string;content:string;cover_image:string;published:boolean}>('SELECT title,content,cover_image,published FROM posts WHERE slug=$1',[slug])).rows[0]}
describe('atomic pending edit review',()=>{
 it('refuses old submissions for another owner or a withdrawn post without consuming them',async()=>{
  await db.exec('UPDATE posts SET author_id=99')
  await expect(reviewEditRequest(1,'approved')).rejects.toThrow('Request target unavailable')
  await db.exec('UPDATE posts SET author_id=7,published=false')
  await expect(reviewEditRequest(1,'approved')).rejects.toThrow('Request target unavailable')
  expect((await request(1)).status).toBe('pending')
  expect((await post()).title).toBe('Original')
  expect(await reviewEditRequest(1,'rejected')).toMatchObject({request:{status:'rejected'},post:null})
 })
 it('only replaces an owned rejected submission, retaining it if the replacement fails',async()=>{
  const input={post_slug:'public',user_id:7,title:'Replacement',excerpt:'',content:'<p>Replacement</p>',tags:[],from_id:1}
  await expect(createEditRequest(input)).rejects.toThrow('Cannot resubmit')
  await db.exec("UPDATE post_edit_requests SET status='rejected' WHERE id=1")
  await expect(createEditRequest({...input,user_id:8})).rejects.toThrow('Cannot resubmit')
  await db.exec('UPDATE posts SET author_id=NULL')
  await expect(createEditRequest(input)).rejects.toThrow('Cannot resubmit')
  expect((await request(1)).status).toBe('rejected')
  await db.exec('UPDATE posts SET author_id=7')
  await db.exec("ALTER TABLE post_edit_requests ADD CONSTRAINT replacement_failure CHECK(title<>'Fail')")
  await expect(createEditRequest({...input,title:'Fail'})).rejects.toThrow()
  expect((await request(1)).status).toBe('rejected')
  const replacement=await createEditRequest(input)
  captured.resubmit=lastQueries
  expect(replacement).toMatchObject({status:'pending',title:'Replacement'})
  expect(await request(1)).toBeUndefined()
  await expect(createEditRequest(input)).rejects.toThrow('Cannot resubmit')
  await db.exec('ALTER TABLE post_edit_requests DROP CONSTRAINT replacement_failure')
 })
 it('commits sanitized content and request together and preserves existing cover/publication',async()=>{
  const result=await reviewEditRequest(1,'approved','Reviewed')
  captured.approve=lastQueries
  expect(result).toMatchObject({request:{status:'approved',admin_note:'Reviewed'},post:{slug:'public',published:true}})
  expect(await post()).toEqual({title:'New',content:'<p>New</p>',cover_image:'/old.png',published:true})
  await expect(reviewEditRequest(1,'approved')).rejects.toThrow('Request already reviewed')
 })
 it('creates a draft exactly once and rolls back on a colliding slug',async()=>{
  expect(await reviewEditRequest(2,'approved')).toMatchObject({post:{slug:'draft',published:false}})
  expect((await db.query<{author_id:number}>("SELECT author_id FROM posts WHERE slug='draft'")).rows[0].author_id).toBe(7)
  await expect(reviewEditRequest(2,'approved')).rejects.toThrow('Request already reviewed')
  await db.exec("INSERT INTO post_edit_requests SELECT 6,post_slug,user_id,title,excerpt,content,tags,cover_image,'pending',NULL,NOW(),NULL FROM post_edit_requests WHERE id=2")
  await expect(reviewEditRequest(6,'approved')).rejects.toMatchObject({code:'23505'})
  expect((await request(6)).status).toBe('pending')
 })
 it('keeps both sides unchanged when request finalization fails',async()=>{
  await expect(reviewEditRequest(4,'approved')).rejects.toThrow()
  expect((await post()).title).toBe('Original')
  expect(await request(4)).toMatchObject({status:'pending',reviewed_at:null})
 })
 it('rejects edition representation drift but permits unchanged fields and cover editing',async()=>{
  await expect(reviewEditRequest(3,'approved')).rejects.toBeInstanceOf(EditionEditConflict)
  expect((await post('edition')).title).toBe('Original');expect((await request(3)).status).toBe('pending')
  await db.exec("UPDATE post_edit_requests SET title='Original',excerpt='Old',content='<p>Old</p>',tags=ARRAY['old'],cover_image='/new.png' WHERE id=3")
  expect(await reviewEditRequest(3,'approved')).toMatchObject({post:{slug:'edition',published:true}})
  expect((await post('edition')).cover_image).toBe('/new.png')
 })
 it('rejects a missing target without consuming the request, and rejection does not edit content',async()=>{
  await expect(reviewEditRequest(5,'approved')).rejects.toThrow('Post not found')
  expect((await request(5)).status).toBe('pending')
  expect(await reviewEditRequest(1,'rejected')).toMatchObject({request:{status:'rejected'},post:null})
  captured.reject=lastQueries
  expect((await post()).title).toBe('Original')
  await expect(reviewEditRequest(999,'approved')).rejects.toThrow('Request not found')
 })
 it('refuses an obsolete snapshot when another review or content replacement wins',async()=>{
  const normal=sql.transaction.getMockImplementation()!
  sql.transaction.mockImplementationOnce(async(build:(tx:typeof query)=>Query[])=>{
   await db.exec("UPDATE post_edit_requests SET status='rejected' WHERE id=1")
   return normal(build)
  })
  await expect(reviewEditRequest(1,'approved')).rejects.toThrow('Request already reviewed')
  expect((await post()).title).toBe('Original')
  sql.transaction.mockImplementationOnce(async(build:(tx:typeof query)=>Query[])=>{
   await db.exec("UPDATE post_edit_requests SET title='Concurrent replacement' WHERE id=2")
   return normal(build)
  })
  await expect(reviewEditRequest(2,'approved')).rejects.toThrow('Request already reviewed')
  expect(await post('draft')).toBeUndefined()
  expect((await request(2)).status).toBe('pending')
 })
})
