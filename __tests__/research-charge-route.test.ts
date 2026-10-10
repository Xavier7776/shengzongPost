// @vitest-environment node
import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'
const { session, chargeResearch }=vi.hoisted(() => ({session:vi.fn(),chargeResearch:vi.fn()}))
vi.mock('next-auth',() => ({getServerSession:session}))
vi.mock('@/lib/authOptions',() => ({authOptions:{}}))
vi.mock('@/lib/db',() => ({chargeResearch,getPoints:vi.fn()}))
import { POST } from '@/app/api/research/points/route'
const requestId='00000000-0000-4000-8000-000000000001'
const request=(body?:string) => new NextRequest('https://blog.test/api/research/points',{method:'POST',headers:{origin:'https://blog.test'},body})
beforeEach(() => {
  vi.clearAllMocks(); session.mockResolvedValue({user:{id:'7'}})
  chargeResearch.mockResolvedValue({paid:true,remaining:2000,refSlug:'reference'})
})
describe('research charge API compatibility and validation',() => {
  it('uses only the signed account and returns the existing response contract',async () => {
    const response=await POST(request(JSON.stringify({requestId,userId:99})))
    expect(await response.json()).toEqual({success:true,remaining:2000,cost:2000,refSlug:'reference'})
    expect(chargeResearch).toHaveBeenCalledWith(7,requestId,2000)
    expect(response.headers.get('cache-control')).toBe('no-store')
  })
  it('rejects malformed input and unauthenticated calls before charging',async () => {
    for (const body of ['{','[]','null',JSON.stringify({requestId:'bad'})]) expect((await POST(request(body))).status).toBe(400)
    expect(chargeResearch).not.toHaveBeenCalled()
    session.mockResolvedValue(null)
    expect((await POST(request(JSON.stringify({requestId})))).status).toBe(401)
    expect(chargeResearch).not.toHaveBeenCalled()
  })
  it('keeps bodyless cached-client compatibility and returns 402 without a paid record',async () => {
    chargeResearch.mockResolvedValue({paid:false,remaining:10,refSlug:'reference'})
    const response=await POST(request())
    expect(response.status).toBe(402)
    expect(await response.json()).toMatchObject({current:10,shortage:1990})
    expect(chargeResearch).toHaveBeenCalledWith(7,expect.stringMatching(/^[a-f0-9-]{36}$/),2000)
  })
})
