import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
const {admin,create,update,remove,invalidate,edit,review}=vi.hoisted(()=>({admin:vi.fn(),create:vi.fn(),update:vi.fn(),remove:vi.fn(),invalidate:vi.fn(),edit:vi.fn(),review:vi.fn()}))
vi.mock('@/lib/auth',()=>({requireAdminApi:admin}))
vi.mock('@/lib/content-cache',()=>({invalidatePublishedContent:invalidate}))
vi.mock('next-auth',()=>({getServerSession:vi.fn()}))
vi.mock('@/lib/authOptions',()=>({authOptions:{}}))
vi.mock('@/lib/db',()=>({createPost:create,updatePost:update,deletePost:remove,getAdminUserId:()=>1,getPostBySlugAdmin:vi.fn(),getPostBySlug:vi.fn(),getUserRoleById:vi.fn(),getEditRequestById:edit,reviewEditRequest:review}))
import { POST } from '@/app/api/posts/route'
import { PATCH, DELETE } from '@/app/api/posts/[slug]/route'
import { PATCH as reviewPatch } from '@/app/api/edit-requests/all/[id]/route'
const req=(method:string,body:unknown)=>new NextRequest('https://site.example/api/posts/old',{method,body:JSON.stringify(body)})
beforeEach(()=>{
  for(const mock of [admin,create,update,remove,invalidate,edit,review])mock.mockReset()
  admin.mockResolvedValue({user:{id:'1',role:'admin'}})
  create.mockResolvedValue({slug:'new',published:true});update.mockResolvedValue({slug:'new',published:false})
  invalidate.mockReturnValue('invalidated')
  edit.mockResolvedValue({status:'pending',post_slug:'old',title:'Approved',content:'body',tags:[]})
  review.mockResolvedValue({request:{status:'approved'},post:null})
})
describe('successful content commits invalidate public distribution',()=>{
  it('invalidates a new publication, preserves a draft and never invalidates a rejected request',async()=>{
    expect((await POST(req('POST',{slug:'new',title:'Title',content:'body',published:true}))).status).toBe(201)
    expect(invalidate).toHaveBeenCalledWith(['new'])
    invalidate.mockClear();create.mockResolvedValue({slug:'draft',published:false})
    expect((await POST(req('POST',{slug:'draft',title:'Title',content:'body'}))).headers.get('X-Content-Cache-Status')).toBe('unchanged')
    admin.mockResolvedValue(null)
    expect((await POST(req('POST',{}))).status).toBe(401)
    expect(invalidate).not.toHaveBeenCalled()
  })
  it('invalidates both slugs on rename/withdraw and still reports a committed change if cache fails',async()=>{
    invalidate.mockReturnValue('failed')
    const result=await PATCH(req('PATCH',{slug:'new',published:false}),{params:{slug:'old'}})
    expect(result.status).toBe(200);expect(result.headers.get('X-Content-Cache-Status')).toBe('failed')
    expect(invalidate).toHaveBeenCalledWith(['old','new'])
    expect(update).toHaveBeenCalledOnce()
  })
  it('invalidates a deleted slug only after the database commit',async()=>{
    expect((await DELETE(new NextRequest('https://site.example/api/posts/old'),{params:{slug:'old'}})).status).toBe(200)
    expect(invalidate).toHaveBeenCalledWith(['old'])
    expect(remove.mock.invocationCallOrder[0]).toBeLessThan(invalidate.mock.invocationCallOrder[0])
  })
  it('invalidates an approved edit to an existing published post',async()=>{
    review.mockResolvedValue({request:{status:'approved'},post:{slug:'old',published:true}})
    expect((await reviewPatch(req('PATCH',{status:'approved'}),{params:{id:'1'}})).status).toBe(200)
    expect(invalidate).toHaveBeenCalledWith(['old'])
    expect(review.mock.invocationCallOrder[0]).toBeLessThan(invalidate.mock.invocationCallOrder[0])
    invalidate.mockClear()
    review.mockResolvedValue({request:{status:'rejected'},post:null})
    await reviewPatch(req('PATCH',{status:'rejected'}),{params:{id:'1'}})
    expect(invalidate).not.toHaveBeenCalled()
  })
})
