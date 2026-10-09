import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
const { sql, history } = vi.hoisted(() => ({sql:vi.fn(),history:vi.fn()}))
vi.mock('@/lib/db/_core', () => ({sql}))
vi.mock('@/components/sections/ReadingHistory', () => ({getReadingHistory:history}))
import LearnIndex from '@/app/learn/page'
const article = {
  slug:'daily-learn-2026-10-09',
  title:'结构切块与安慰剂消融对照',
  excerpt:'使用固定长度、结构边界与真实标题路径比较 RAG 检索的证据覆盖。',
  topic:'rag',
  edition_date:'2026-10-09',
}
beforeEach(() => {
  history.mockReset().mockReturnValue([])
  sql.mockReset().mockImplementation(async (strings:TemplateStringsArray) => {
    const query = strings.join(' ')
    if (query.includes('GROUP BY l.topic')) return [{topic:'rag',total:1}]
    if (query.includes('COUNT(*)::int AS total')) return [{total:1}]
    return [article]
  })
})
describe('AI technology study center', () => {
  it('shows featured issue, permalink and all four engineering tracks', async () => {
    render(await LearnIndex())
    expect(screen.getByRole('heading',{name:'每天真正掌握一项技术'})).toBeInTheDocument()
    expect(screen.getByRole('heading',{name:article.title})).toBeInTheDocument()
    expect(screen.getByRole('link',{name:/阅读本期/})).toHaveAttribute('href','/blog/'+article.slug)
    expect(screen.getByRole('navigation',{name:'专刊主题筛选'})).toBeInTheDocument()
    expect(screen.getByRole('link',{name:/多模态技术/})).toHaveAttribute('href','/learn?topic=multimodal')
  })
  it('filters categories with shareable URL query params', async () => {
    render(await LearnIndex({searchParams:{topic:'rag'}}))
    expect(screen.getByRole('region',{name:'历史精读'})).toBeInTheDocument()
    expect(screen.getByRole('link',{name:/RAG 与检索.*1 期/})).toHaveAttribute('aria-current','page')
    const queryText = sql.mock.calls.map(x=>(x[0] as TemplateStringsArray).join(' '))
    expect(queryText.some(x=>x.includes('l.topic='))).toBe(true)
  })
  it('keeps an empty state when the editions table does not yet exist', async () => {
    sql.mockRejectedValue({code:'42P01'})
    render(await LearnIndex())
    expect(screen.getByText('精读专刊准备中，敬请期待。')).toBeInTheDocument()
  })
  it('surfaces real database outages', async () => {
    sql.mockRejectedValue(new Error('database unavailable'))
    await expect(LearnIndex()).rejects.toThrow('database unavailable')
  })
})
