import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
const {requireAdmin,sql,validateEdition,textVersion,publicVisibility}=vi.hoisted(()=>({
  requireAdmin:vi.fn(), sql:vi.fn(), validateEdition:vi.fn(), textVersion:vi.fn(),publicVisibility:vi.fn(),
}))
vi.mock('@/lib/auth',()=>({requireAdmin}))
vi.mock('@/lib/db/_core',()=>({sql}))
vi.mock('@/lib/learn/document',()=>({
  chinaDate:()=> '2026-10-09',
  TOPICS:{agent:'Agent 前沿',rag:'RAG 与检索',engineering:'软件工程',multimodal:'多模态技术'},
  validateEdition,
}))
vi.mock('@/lib/learn/publication-contract',()=>({textVersion}))
vi.mock('@/lib/learn/publish',()=>({publicVisibility}))
import AdminLearnPage from '@/app/admin/learn/page'

const edition={
  slug:'daily-learn-2026-10-09',title:'深度学习系统架构',
  published:true,content:'expected content',edition_date:'2026-10-09',
  topic:'rag',document:{version:1,date:'2026-10-09',topic:'rag',title:'深度学习系统架构'},created_at:'2026-10-09T00:30:00Z',
  id:1,post_id:1,status:'published',
}
beforeEach(()=>{
  requireAdmin.mockReset().mockResolvedValue({user:{id:'1',role:'admin'}})
  sql.mockReset().mockResolvedValue([edition])
  validateEdition.mockReset().mockReturnValue({ok:true,errors:[]})
  textVersion.mockReset().mockReturnValue('expected content')
  publicVisibility.mockReset().mockResolvedValue('public_ready')
  localStorage.clear()
})
describe('daily edition admin audit surface',()=>{
  it('never reads editions before verifying the administrator identity',async()=>{
    requireAdmin.mockRejectedValue(new Error('NEXT_REDIRECT'))
    await expect(AdminLearnPage()).rejects.toThrow('NEXT_REDIRECT')
    expect(sql).not.toHaveBeenCalled()
    expect(publicVisibility).not.toHaveBeenCalled()
  })
  it('shows validated publications with edition details',async()=>{
    render(await AdminLearnPage())
    expect(screen.getByRole('heading',{name:'出版状态与内容一致性'})).toBeInTheDocument()
    expect(screen.getByText('深度学习系统架构')).toBeInTheDocument()
    expect(screen.getAllByText('正常').length).toBeGreaterThan(0)
    expect(screen.getByRole('link',{name:'查看文章'})).toHaveAttribute('href','/blog/daily-learn-2026-10-09')
  })
  it('flags stale or manually changed fallback content',async()=>{
    textVersion.mockReturnValue('different content')
    render(await AdminLearnPage())
    expect(screen.getAllByText('正文与结构数据不一致').length).toBeGreaterThan(0)
  })
  it('reports invalid editions without presenting false confidence',async()=>{
    validateEdition.mockReturnValue({ok:false,errors:['missing citations','bad provenance']})
    render(await AdminLearnPage())
    expect(screen.getAllByText('结构校验失败').length).toBeGreaterThan(0)
    expect(screen.getByText(/missing citations/)).toBeInTheDocument()
    expect(textVersion).not.toHaveBeenCalled()
  })
  it('renders database failure as unavailable without inferring missing editions or fetching public pages',async()=>{
    const log=vi.spyOn(console,'error').mockImplementation(()=>{})
    try {
    sql.mockRejectedValue(new Error('postgres://private-credential@host/db'))
    render(await AdminLearnPage())
    expect(screen.getByText(/数据库观察失败/)).toBeInTheDocument()
    expect(screen.queryByText(/private-credential/)).not.toBeInTheDocument()
    expect(publicVisibility).not.toHaveBeenCalled()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(log.mock.calls).toEqual([['[learn] database observation failed',{category:'database_unavailable'}]])
    } finally {log.mockRestore()}
  })
  it('labels task history unknown and independently reports public pending',async()=>{
    publicVisibility.mockResolvedValue('public_pending')
    render(await AdminLearnPage())
    expect(screen.getByText(/无独立审计/)).toBeInTheDocument()
    expect(screen.getAllByText(/公网待刷新/).length).toBeGreaterThan(0)
    expect(publicVisibility).toHaveBeenCalledOnce()
    expect(sql.mock.calls[0][0].join('')).toContain('FULL OUTER JOIN')
  })
})
