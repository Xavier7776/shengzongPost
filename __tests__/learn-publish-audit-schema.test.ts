// @vitest-environment node
import { PGlite } from '@electric-sql/pglite'
import { readFileSync } from 'node:fs'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
const db=new PGlite()
const migration=readFileSync(new URL('../supabase/migrations/056_learn_publish_runs.sql',import.meta.url),'utf8')
beforeAll(()=>db.exec(migration));afterAll(()=>db.close())
describe('candidate persistent publication observations',()=>{
  it('supports idempotent attempt identity without touching content tables',async()=>{
    await db.exec(migration)
    const insert="INSERT INTO learn_publish_runs(attempt_id,edition_date,source,status) VALUES('00000000-0000-4000-8000-000000000001','2026-10-09','manual','started') ON CONFLICT(attempt_id) DO NOTHING"
    await db.exec(insert);await db.exec(insert)
    expect((await db.query<{count:number}>('SELECT COUNT(*)::int AS count FROM learn_publish_runs')).rows[0].count).toBe(1)
    expect((await db.query("SELECT to_regclass('public.posts') AS posts")).rows[0]).toEqual({posts:null})
  })
  it.each([
    "'chatgpt_task','started'",
    "'manual','public_verified'",
    "'manual','db_verified'",
    "'manual','invented-success'",
  ])('refuses unsupported or incomplete evidence %s',async fields=>{
    await expect(db.exec(`INSERT INTO learn_publish_runs(attempt_id,edition_date,source,status) VALUES('00000000-0000-4000-8000-000000000002','2026-10-09',${fields})`)).rejects.toThrow()
  })
  it('retains categorized failures without raw sensitive error fields',async()=>{
    await db.exec("INSERT INTO learn_publish_runs(attempt_id,edition_date,source,status,error_category) VALUES('00000000-0000-4000-8000-000000000003','2026-10-09','manual','failed','channel_unavailable')")
    await expect(db.exec("UPDATE learn_publish_runs SET error_category='postgres://secret@db' WHERE attempt_id='00000000-0000-4000-8000-000000000003'")).rejects.toThrow()
  })
  it('rolls back isolated observation writes without affecting earlier attempts',async()=>{
    await db.exec("BEGIN; INSERT INTO learn_publish_runs(attempt_id,edition_date,source,status) VALUES('00000000-0000-4000-8000-000000000004','2026-10-09','manual','unknown'); ROLLBACK")
    expect((await db.query("SELECT attempt_id FROM learn_publish_runs WHERE attempt_id='00000000-0000-4000-8000-000000000004'")).rows).toEqual([])
  })
})
