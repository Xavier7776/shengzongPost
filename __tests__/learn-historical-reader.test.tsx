import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { renderToString } from 'react-dom/server'
import { hydrateRoot } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { validateEdition, type Edition } from '@/lib/learn/document'
import { editionFingerprint, textVersion } from '@/lib/learn/publication-contract'
import { auditPublication, publicationCalendar, publicationSummary, type PublicationRow } from '@/lib/learn/operations'
import { LEARN_PROGRESS_KEY, parseLearningProgress, serializeLearningProgress } from '@/lib/learn/progress'
import history09 from './fixtures/learn-published-2026-10-09.json'
import history10 from './fixtures/learn-published-2026-10-10.json'
const { sql, requireAdmin, publicVisibility } = vi.hoisted(() => ({ sql:vi.fn(), requireAdmin:vi.fn(), publicVisibility:vi.fn() }))
vi.mock('@/lib/db/_core', () => ({ sql }))
vi.mock('@/lib/auth', () => ({ requireAdmin }))
vi.mock('@/lib/learn/publish', () => ({ publicVisibility }))
vi.mock('@/components/sections/AttachmentList', () => ({ default: () => null }))
vi.mock('@/components/sections/CodeCopyButton', () => ({ default: () => null }))
vi.mock('@/components/sections/ImageLazyLoad', () => ({ default: () => null }))
import PostContent from '@/app/blog/[slug]/PostContent'
import LearnArticle from '@/app/blog/[slug]/LearnArticle'
import LearnToc from '@/app/blog/[slug]/LearnToc'
import AdminLearnPage from '@/app/admin/learn/page'
import type { Post } from '@/lib/db/posts'
const snapshots = [history09, history10] as PublicationRow[]
beforeEach(() => { sql.mockReset(); localStorage.clear(); requireAdmin.mockResolvedValue({user:{role:'admin'}}); publicVisibility.mockResolvedValue('public_ready') })
afterEach(() => vi.restoreAllMocks())

describe('unaltered published history', () => {
  it('records every real strict validation failure and exact text/fingerprint', () => {
    expect(validateEdition(history09.document)).toEqual({ok:true,errors:[],charCount:4857})
    expect(validateEdition(history10.document)).toEqual({ok:false,errors:['block 32: quiz','block 34: quiz'],charCount:3614})
    expect(editionFingerprint(history10.document as Edition)).toBe('7c56c69cdcb610768bca28e873f4e3b2478c66854151c02af71d8d5469a9b4d2')
    snapshots.forEach(row => expect(textVersion(row.document as Edition)).toBe(row.content))
    expect(auditPublication(history09).code).toBe('ok')
    expect(auditPublication(history10).code).toBe('historical')
  })
  it('keeps historical exceptions out of compliance counts and labels the admin surface', async () => {
    const checked = snapshots.map(row=>({...row,audit:auditPublication(row)}))
    expect(publicationSummary(checked)).toEqual({latestDate:'2026-10-09',consecutiveDays:1})
    expect(publicationCalendar(checked,new Date('2026-10-10T02:00:00Z'))[0].code).toBe('historical')
    sql.mockResolvedValue(snapshots)
    render(await AdminLearnPage())
    expect(screen.getAllByText('历史兼容（未完全合规）').length).toBeGreaterThan(0)
    expect(screen.getByText(/历史兼容（未计入完全合规）：1 期/)).toBeInTheDocument()
    expect(screen.getByText(/block 32: quiz；block 34: quiz/)).toBeInTheDocument()
  })
  it.each(snapshots)('renders $edition_date with charts, quiz interaction, ToC and persistent progress', async row => {
    sql.mockResolvedValue([row])
    const edition = row.document as Edition
    const tree = <><article id="blog-reader-root">{await PostContent({post:{...row,updated_at:row.created_at,excerpt:edition.excerpt,tags:[],cover_image:null} as Post})}</article><LearnToc/></>
    const view = render(tree)
    expect(view.container.querySelector('[data-learn-validation]')).toHaveAttribute('data-learn-validation',row.edition_date==='2026-10-10'?'historical':'ok')
    expect(screen.getByText('教学示例数据，非论文实验结果')).toBeInTheDocument()
    expect(screen.getByRole('button',{name:'开始学习'})).toBeInTheDocument()
    const heading = edition.blocks.find(b=>b.type==='heading')!
    if(heading.type==='heading') expect(screen.getAllByRole('button',{name:heading.text}).length).toBeGreaterThan(0)
    for(const b of edition.blocks) if(b.type==='quiz') {
      const section=screen.getByRole('heading',{name:b.question}).closest('section')!
      fireEvent.click(within(section).getByRole('button',{name:String.fromCharCode(65+b.answerIndex)+'. '+b.options[b.answerIndex]}))
      expect(within(section).getByRole('status')).toHaveTextContent('回答正确')
    }
    fireEvent.click(screen.getByRole('checkbox',{name:/我已动手完成/}))
    fireEvent.click(screen.getByRole('button',{name:'标记本期已完成'}))
    expect(parseLearningProgress(localStorage.getItem(LEARN_PROGRESS_KEY))[row.slug!]).toMatchObject({state:'completed',fingerprint:editionFingerprint(edition)})
    view.unmount()
    render(tree)
    expect(screen.getByText('已完成')).toBeInTheDocument()
    await act(async()=>{}) // Flush the ToC MutationObserver after restored progress renders.
  })
  it.each(snapshots)('hydrates $edition_date without mismatches even with saved local progress', async row => {
    sql.mockResolvedValue([row])
    const tree=await LearnArticle({slug:row.slug!,content:row.content!})
    const host=document.createElement('div'); document.body.appendChild(host)
    host.innerHTML=renderToString(tree)
    const edition=row.document as Edition
    localStorage.setItem(LEARN_PROGRESS_KEY,serializeLearningProgress({[row.slug!]:{
      slug:row.slug!,title:edition.title,fingerprint:editionFingerprint(edition),state:'completed',
      answers:Object.fromEntries(edition.blocks.flatMap((b,i)=>b.type==='quiz'?[[String(i),b.answerIndex]]:[])),
      practiceDone:true,position:0,section:'',updatedAt:Date.now(),completedAt:Date.now(),
    }}))
    const recover=vi.fn(), error=vi.spyOn(console,'error').mockImplementation(()=>{})
    let root:ReturnType<typeof hydrateRoot>
    try {
      await act(async()=>{ root=hydrateRoot(host,tree,{onRecoverableError:recover}) })
      expect(recover).not.toHaveBeenCalled()
      expect(error).not.toHaveBeenCalled()
      expect(host.textContent).toContain('已完成')
    } finally { await act(async()=>root!.unmount());host.remove() }
  })
  it.each(['question','answer','chart','source','extra','date'])('rejects %s mutations even when text is regenerated', mutation => {
    const row=structuredClone(history10)
    const e=row.document as Edition
    if(mutation==='question' && e.blocks[32].type==='quiz')e.blocks[32].question+='？'
    if(mutation==='answer' && e.blocks[32].type==='quiz')e.blocks[32].answerIndex=1
    if(mutation==='chart') { const chart=e.blocks.find(b=>b.type==='chart')!;if(chart.type==='chart')chart.points[0].value++ }
    if(mutation==='source')e.sources[0].url='https://evil.example/abs/2610.12345'
    if(mutation==='extra')Object.assign(e,{unreviewed:true})
    if(mutation==='date') {e.date='2026-10-11';row.edition_date=e.date;row.slug='daily-learn-'+e.date}
    row.content=textVersion(e)
    expect(auditPublication(row).code).toBe('invalid')
  })
  it.each([{published:false},{status:'draft'},{post_id:999},{title:'changed'},{topic:'rag'},{edition_date:'2026-10-11'},{slug:'daily-learn-2026-10-11'},{content:'edited body'}])('refuses unpublished, drifted or mislinked historical rows: %j', async patch => {
    const row={...history10,...patch}
    expect(['ok','historical']).not.toContain(auditPublication(row).code)
    sql.mockResolvedValue([row])
    expect(await LearnArticle({slug:row.slug,content:row.content})).toBeNull()
  })
  it('preserves safe fallback for manual post edits', async () => {
    sql.mockResolvedValue([history10])
    render(await PostContent({post:{...history10,content:'管理员保留的原始正文'} as unknown as Post}))
    expect(screen.getByText('管理员保留的原始正文')).toBeInTheDocument()
    expect(screen.queryByRole('button',{name:'开始学习'})).not.toBeInTheDocument()
  })
})
