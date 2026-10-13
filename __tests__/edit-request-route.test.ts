import {beforeEach,describe,expect,it,vi} from 'vitest'
import {NextRequest} from 'next/server'
const {session,admin,allow,create,review,invalidate}=vi.hoisted(()=>({session:vi.fn(),admin:vi.fn(),allow:vi.fn(),create:vi.fn(),review:vi.fn(),invalidate:vi.fn()}))
vi.mock('next-auth',()=>({getServerSession:session}))
vi.mock('@/lib/authOptions',()=>({authOptions:{}}))
vi.mock('@/lib/auth',()=>({requireAdminApi:admin}))
vi.mock('@/lib/auth-rate-limit',()=>({allowAuthAttempt:allow}))
vi.mock('@/lib/content-cache',()=>({invalidatePublishedContent:invalidate}))
vi.mock('@/lib/db',()=>({createEditRequest:create,getEditRequestsByUser:vi.fn(),reviewEditRequest:review,getEditRequestById:vi.fn()}))
import {POST} from '@/app/api/edit-requests/route'
import {GET,PATCH} from '@/app/api/edit-requests/all/[id]/route'
const body={post_slug:'owned',title:'Title',content:'<p>Body</p>'}
const request=(method:string,data:unknown)=>new NextRequest('https://site.example/api/edit-requests',{method,body:JSON.stringify(data)})
beforeEach(()=>{
 vi.clearAllMocks();session.mockResolvedValue({user:{id:'7'}});admin.mockResolvedValue({user:{id:'1',role:'admin'}})
 allow.mockResolvedValue(true);create.mockResolvedValue({id:1,status:'pending'});review.mockResolvedValue({request:{status:'approved'},post:{slug:'draft',published:false}})
})
describe('submission and review HTTP contracts',()=>{
 it('uses the authenticated user and passes rejected replacement in the single creation operation',async()=>{
  expect((await POST(request('POST',{...body,user_id:99,from_id:12}))).status).toBe(201)
  expect(create).toHaveBeenCalledWith({...body,user_id:7,excerpt:'',tags:[],cover_image:null,from_id:12})
 })
 it('rejects invalid body fields before creating a request',async()=>{
  for(const bad of [{title:1},{excerpt:{}},{tags:['valid',1]},{cover_image:'javascript:alert(1)'},{from_id:0},{from_id:1.5}])
   expect((await POST(request('POST',{...body,...bad}))).status).toBe(400)
  expect(create).not.toHaveBeenCalled()
 })
 it('refuses anonymous and rate-limited submissions, and reports a replacement conflict',async()=>{
  session.mockResolvedValueOnce(null);expect((await POST(request('POST',body))).status).toBe(401)
  allow.mockResolvedValueOnce(false);expect((await POST(request('POST',body))).status).toBe(429)
  expect(create).not.toHaveBeenCalled()
  create.mockRejectedValueOnce(new Error('Cannot resubmit'));expect((await POST(request('POST',body))).status).toBe(409)
 })
 it('rejects unauthenticated, invalid IDs and invalid approval fields without consuming requests',async()=>{
  admin.mockResolvedValueOnce(null);expect((await PATCH(request('PATCH',{status:'approved'}),{params:Promise.resolve({id:'1'})})).status).toBe(401)
  for(const id of ['0','1.5','Infinity','9007199254740992']) {
   expect((await PATCH(request('PATCH',{status:'approved'}),{params:Promise.resolve({id})})).status).toBe(400)
   expect((await GET(new NextRequest('https://site.example'),{params:Promise.resolve({id})})).status).toBe(400)
  }
  for(const bad of [{status:'pending'},{status:'approved',admin_note:{}}])expect((await PATCH(request('PATCH',bad),{params:Promise.resolve({id:'1'})})).status).toBe(400)
  expect(review).not.toHaveBeenCalled()
 })
 it('reports conflicts and missing targets without invalidating public content',async()=>{
  for(const [error,status] of [[new Error('Request already reviewed'),409],[new Error('Request target unavailable'),409],[new Error('Post not found'),404],[new Error('Request not found'),404],[{code:'23505'},409]] as const) {
   review.mockRejectedValueOnce(error);expect((await PATCH(request('PATCH',{status:'approved'}),{params:Promise.resolve({id:'1'})})).status).toBe(status)
  }
  expect(invalidate).not.toHaveBeenCalled()
 })
 it('keeps newly approved drafts outside public cache invalidation',async()=>{
  const response=await PATCH(request('PATCH',{status:'approved'}),{params:Promise.resolve({id:'1'})})
  expect(response.status).toBe(200);expect(response.headers.get('X-Content-Cache-Status')).toBe('unchanged')
  expect(invalidate).not.toHaveBeenCalled()
 })
})
