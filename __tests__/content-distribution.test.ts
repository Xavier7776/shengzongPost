import { beforeEach, describe, expect, it, vi } from 'vitest'
const {posts,skills,projects,cache}=vi.hoisted(()=>({posts:vi.fn(),skills:vi.fn(),projects:vi.fn(),cache:vi.fn((fn:()=>Promise<unknown>,_keys:string[],_options:unknown)=>fn)}))
vi.mock('next/cache',()=>({unstable_cache:cache}))
vi.mock('@/lib/db',()=>({getAllPosts:posts,getEnabledProjects:projects}))
vi.mock('@/lib/db-skills',()=>({getSkills:skills}))
vi.mock('@/lib/site-url',()=>({getSiteUrl:()=> 'https://site.example'}))
import { GET, revalidate as feedTTL } from '@/app/feed.xml/route'
import sitemap, * as sitemapModule from '@/app/sitemap'
const article={slug:'published',title:'Title & evidence',excerpt:'Published <excerpt>',created_at:'2026-10-01T00:00:00Z',updated_at:'2026-10-09T00:00:00Z'}
beforeEach(()=>{posts.mockReset().mockResolvedValue([article]);skills.mockReset().mockResolvedValue({skills:[]});projects.mockReset().mockResolvedValue([])})
describe('public content distribution cache and dates',()=>{
  it('bounds feed and sitemap regeneration to five minutes',()=>{
    expect(feedTTL).toBe(0)
    expect((sitemapModule as Record<string,unknown>).revalidate).toBe(0)
    expect(cache.mock.calls).toHaveLength(2)
    for(const args of cache.mock.calls) expect(args[2]).toEqual({revalidate:300,tags:['published-content']})
  })
  it('uses actual content changes for feed build date and retains original pubDate',async()=>{
    const response=await GET(),xml=await response.text()
    expect(response.headers.get('content-type')).toContain('application/rss+xml')
    expect(xml).toContain('<lastBuildDate>Fri, 09 Oct 2026 00:00:00 GMT</lastBuildDate>')
    expect(xml).toContain('<pubDate>Thu, 01 Oct 2026 00:00:00 GMT</pubDate>')
    expect(xml).toContain('Title &amp; evidence')
    expect(xml).toContain('Published &lt;excerpt&gt;')
  })
  it('omits invented sitemap timestamps and query variants',async()=>{
    const pages=await sitemap()
    expect(pages.every(page=>!page.url.includes('?'))).toBe(true)
    expect(pages.filter(page=>!page.url.includes('/blog/published')).every(page=>!page.lastModified)).toBe(true)
    expect(pages.find(page=>page.url.endsWith('/blog/published'))?.lastModified).toEqual(new Date(article.updated_at))
  })
  it('does not invent a lastBuildDate for an empty feed',async()=>{
    posts.mockResolvedValue([])
    expect(await (await GET()).text()).not.toContain('<lastBuildDate>')
  })
})
