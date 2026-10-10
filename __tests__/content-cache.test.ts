import { beforeEach, describe, expect, it, vi } from 'vitest'
const {path,tag}=vi.hoisted(()=>({path:vi.fn(),tag:vi.fn()}))
vi.mock('next/cache',()=>({revalidatePath:path,revalidateTag:tag}))
import { invalidatePublishedContent } from '@/lib/content-cache'
beforeEach(()=>{path.mockReset();tag.mockReset()})
describe('content invalidation across public entry points',()=>{
  it('covers distribution, old/new slugs and adjacent article navigation without private layouts',()=>{
    expect(invalidatePublishedContent(['old','new','old'])).toBe('invalidated')
    expect(tag).toHaveBeenCalledWith('published-content')
    for(const route of ['/','/blog','/learn','/feed.xml','/sitemap.xml','/blog/old','/blog/new'])expect(path).toHaveBeenCalledWith(route)
    expect(path).toHaveBeenCalledWith('/blog/[slug]','page')
    expect(path.mock.calls.filter(([route])=>route==='/blog/old')).toHaveLength(1)
    expect(path.mock.calls.every(([route,type])=>!route.startsWith('/admin')&&!route.startsWith('/onlyus')&&type!=='layout')).toBe(true)
  })
  it('reports partial failure while still attempting remaining invalidations',()=>{
    const log=vi.spyOn(console,'error').mockImplementation(()=>{})
    try {
      path.mockImplementation((route:string)=>{if(route==='/blog')throw Error('secret internal exception')})
      expect(invalidatePublishedContent(['article'])).toBe('failed')
      expect(path).toHaveBeenCalledWith('/sitemap.xml')
      expect(path).toHaveBeenCalledWith('/blog/[slug]','page')
      expect(log.mock.calls).toEqual([['[content] cache invalidation incomplete']])
    } finally {log.mockRestore()}
  })
})
