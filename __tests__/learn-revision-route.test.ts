// @vitest-environment node
import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { makeEditionV2 } from './fixtures/learn-edition-v2'
import { PublicationError } from '@/lib/learn/publication-contract'
const m=vi.hoisted(()=>({admin:vi.fn(),sql:vi.fn(),revise:vi.fn(),updatePost:vi.fn(),getEdit:vi.fn(),review:vi.fn()}))
vi.mock('@/lib/auth',()=>({requireAdminApi:m.admin}))
vi.mock('@/lib/db/_core',()=>({sql:m.sql}))
vi.mock('@/lib/learn/publish',()=>({reviseEdition:m.revise}))
vi.mock('@/lib/db',()=>({updatePost:m.updatePost,getEditRequestById:m.getEdit,reviewEditRequest:m.review}))
vi.mock('@/lib/content-cache',()=>({invalidatePublishedContent:vi.fn()}))
import { GET, PATCH } from '@/app/api/admin/learn/[slug]/route'
import { PATCH as approve } from '@/app/api/edit-requests/all/[id]/route'
import { EditionEditConflict } from '@/lib/learn/edit-conflict'
const e=makeEditionV2(),slug='daily-learn-'+e.date,ctx={params:Promise.resolve({slug})}
const req=(body:unknown)=>new NextRequest('http://localhost/api/admin/learn/'+slug,{method:'PATCH',body:JSON.stringify(body)})
beforeEach(()=>{vi.clearAllMocks();m.admin.mockResolvedValue({user:{id:1,role:'admin'}});m.revise.mockResolvedValue({updated:true})})
describe('administrator correction boundary',()=>{
  it('rejects anonymous reads and writes before any SQL or revision',async()=>{
    m.admin.mockResolvedValue(null)
    expect((await GET(req({}),ctx)).status).toBe(401)
    expect((await PATCH(req({}),ctx)).status).toBe(401)
    expect(m.sql).not.toHaveBeenCalled();expect(m.revise).not.toHaveBeenCalled()
  })
  it('requires v2, exact slug and fingerprint, and returns a private response',async()=>{
    expect((await PATCH(req(null),ctx)).status).toBe(400)
    expect((await PATCH(req({edition:e}),ctx)).status).toBe(400)
    expect((await PATCH(req({edition:e,previousFingerprint:'a'.repeat(64)}),{params:Promise.resolve({slug:'other'})})).status).toBe(400)
    const r=await PATCH(req({edition:e,previousFingerprint:'a'.repeat(64)}),ctx)
    expect(r.status).toBe(200);expect(r.headers.get('Cache-Control')).toBe('private, no-store')
    expect(m.revise).toHaveBeenCalledOnce()
  })
  it('returns a readable availability error without leaking a database exception',async()=>{
    m.sql.mockRejectedValueOnce(new Error('sensitive fixture connection detail'))
    const r=await GET(req({}),ctx)
    expect(r.status).toBe(503)
    expect(await r.text()).not.toContain('sensitive fixture')
  })
  it('reports committed readback failures separately and preserves conflict status',async()=>{
    m.revise.mockRejectedValueOnce(new PublicationError('readback_failed',slug,false,[],true))
    const r=await PATCH(req({edition:e,previousFingerprint:'a'.repeat(64)}),ctx)
    expect(r.status).toBe(503);expect(await r.json()).toMatchObject({committed:true,error:'readback_failed'})
    m.revise.mockRejectedValueOnce(new PublicationError('conflict',slug))
    expect((await PATCH(req({edition:e,previousFingerprint:'a'.repeat(64)}),ctx)).status).toBe(409)
  })
  it('keeps an edition edit request pending when approval would drift JSON',async()=>{
    m.getEdit.mockResolvedValue({status:'pending',post_slug:slug,title:'Changed'})
    m.review.mockRejectedValue(new EditionEditConflict())
    const r=await approve(new NextRequest('http://localhost/api/edit-requests/all/1',{method:'PATCH',body:JSON.stringify({status:'approved'})}),{params:Promise.resolve({id:'1'})})
    expect(r.status).toBe(409);expect(m.review).toHaveBeenCalledOnce();expect(m.updatePost).not.toHaveBeenCalled()
  })
})
