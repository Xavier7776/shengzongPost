import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { breadcrumbs, jsonLdText } from '@/lib/seo'
import { withHeadingIds } from '@/lib/html/heading-ids'
import { headingId } from '@/shared/markdown/heading-id'
import { sanitizeRichHtml } from '@/lib/html/sanitize-post'
import HeroClient from '@/components/sections/HeroClient'
import { generateMetadata as learnMetadata } from '@/app/learn/page'
import LearnInteractive from '@/components/learn/LearnInteractive'
import { makeEdition } from './fixtures/learn-edition'
vi.mock('@/lib/db/_core',()=>({sql:vi.fn()}))
vi.mock('@/components/learn/LearningPaths',()=>({default:()=>null}))
vi.mock('next/link',()=>({default:({children,...props}:any)=><a {...props}>{children}</a>}))
afterEach(()=>{vi.useRealTimers();vi.unstubAllGlobals();vi.unstubAllEnvs()})
describe('reading SEO and accessible controls',()=>{
 it('serializes structured data without allowing script termination and uses absolute breadcrumbs',()=>{
   vi.stubEnv('NEXT_PUBLIC_SITE_URL','https://example.test')
   const trail=breadcrumbs([{name:'首页',path:'/'},{name:'文章',path:'/blog/a'}])
   const value=[{headline:'</script><img src=x onerror=alert(1)>'},trail]
   const encoded=jsonLdText(value)
   expect(encoded).not.toContain('</script>');expect(JSON.parse(encoded)).toEqual(value)
   expect(trail.itemListElement[1].item).toBe('https://example.test/blog/a')
 })
 it('indexes the main learning page and canonicalizes query variants without indexing them',async()=>{
   const root=await learnMetadata({});expect(root.alternates?.canonical).toBe('/learn');expect(root.robots).toBeUndefined()
   for(const params of [{topic:'rag'},{page:'2'},{topic:'unknown'}])expect((await learnMetadata({searchParams:Promise.resolve(params)})).robots).toEqual({index:false,follow:true})
 })
 it('keeps text anchors stable when unrelated headings are inserted and disambiguates duplicate text',()=>{
   const used=new Set<string>();expect(headingId('RAG 架构！',used)).toBe('rag-架构');expect(headingId('RAG 架构！',used)).toBe('rag-架构-2')
   const before=withHeadingIds(sanitizeRichHtml('<h2><em>RAG</em> 架构！</h2><h3>代码实践</h3>'))
   const after=withHeadingIds(sanitizeRichHtml('<h2>新章节</h2><h2><em>RAG</em> 架构！</h2><h3>代码实践</h3>'))
   expect(before).toContain('id="rag-架构"');expect(after).toContain('id="rag-架构"');expect(before).toContain('id="blog-toc-heading-0"')
   expect(withHeadingIds(sanitizeRichHtml('<h2 id="x" onclick="alert(1)">安全</h2><script>alert(1)</script>'))).not.toMatch(/onclick|script|alert/)
 })
 it('names carousel controls, pauses automatic changes and disables autoplay under reduced motion',()=>{
   vi.useFakeTimers();vi.stubGlobal('matchMedia',()=>({matches:false}))
   const slides=[{img:'https://images.unsplash.com/photo-a?w=2000',title:'第一张',subtitle:'A'},{img:'/b.png',title:'第二张',subtitle:'B'}]
   const {unmount}=render(<HeroClient slides={slides}/>);expect(screen.getByRole('heading',{level:1})).toHaveTextContent('第一张')
   expect(screen.getByRole('button',{name:'查看第 1 张：第一张'})).toHaveAttribute('aria-pressed','true')
   expect(screen.getByRole('img',{name:'第一张'})).toHaveAttribute('srcset',expect.stringContaining('w=480'))
   expect(screen.getByRole('img',{name:'第二张'})).not.toHaveAttribute('srcset')
   fireEvent.click(screen.getByRole('button',{name:'暂停自动播放'}));vi.advanceTimersByTime(6000);expect(screen.getByRole('heading',{level:1})).toHaveTextContent('第一张')
   fireEvent.click(screen.getByRole('button',{name:'下一张'}));expect(screen.getByRole('heading',{level:1})).toHaveTextContent('第二张');unmount()
   vi.stubGlobal('matchMedia',()=>({matches:true}));render(<HeroClient slides={slides}/>);vi.advanceTimersByTime(6000);expect(screen.getByRole('heading',{level:1})).toHaveTextContent('第一张')
 })
 it('renders unique study anchors and legacy aliases before hydration and keeps them after answering',()=>{
   const edition=makeEdition()
   const {container}=render(<LearnInteractive edition={edition}/>)
   const ids=()=>Array.from(container.querySelectorAll('h2,h3'),heading=>heading.id)
   const before=ids();expect(before.every(Boolean)).toBe(true);expect(new Set(before).size).toBe(before.length)
   expect(container.querySelectorAll('span[id^="learn-section-"]').length).toBe(before.length)
   fireEvent.click(screen.getAllByRole('button',{name:/^A\./})[0]);expect(ids()).toEqual(before)
 })
})
