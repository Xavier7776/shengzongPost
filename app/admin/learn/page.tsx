import Link from 'next/link'
import type { Metadata } from 'next'
import { ArrowLeft, BookOpen, CheckCircle2, AlertTriangle, Clock, ExternalLink } from 'lucide-react'
import { requireAdmin } from '@/lib/auth'
import { sql } from '@/lib/db/_core'
import { chinaDate, validateEdition, TOPICS, type Topic, type Edition } from '@/lib/learn/document'
import { textVersion } from '@/lib/learn/publish'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = {
  title: '技术精读发布健康度 · 管理后台',
  robots: { index: false, follow: false },
}

interface EditionRow {
  slug: string; title: string; published: boolean; content: string
  edition_date: string; topic: Topic; document: unknown; created_at: string
}
type Status = { code: 'ok'|'invalid'|'drift'|'draft'; text: string; detail: string }
function audit(row: EditionRow): Status {
  if (!row.published) return {code:'draft',text:'未公开',detail:'请检查文章发布状态'}
  const check = validateEdition(row.document)
  if (!check.ok) {
    return {code:'invalid',text:'结构校验失败',detail:check.errors.slice(0,3).join('；')}
  }
  if (textVersion(row.document as Edition) !== row.content) {
    return {code:'drift',text:'正文与结构数据不一致',detail:'可能有人手工编辑了文章正文；阅读器会使用安全回退'}
  }
  return {code:'ok',text:'正常',detail:'结构校验通过，正文与结构化数据一致'}
}

export default async function AdminLearnPage() {
  await requireAdmin() // privilege check before any database read
  const rows = await sql`SELECT p.slug,p.title,p.published,p.content,p.created_at::text,
      l.edition_date::text,l.topic,l.document
    FROM learn_editions l JOIN posts p ON p.id=l.post_id
    ORDER BY l.edition_date DESC LIMIT 60`
  const editions = rows as unknown as EditionRow[]
  const checked = editions.map(row => ({ ...row, status: audit(row) }))
  const now = chinaDate()
  const today = checked.find(row => row.edition_date === now)
  const invalid = checked.filter(row => row.status.code === 'invalid' || row.status.code === 'drift')
  const ok = checked.filter(row => row.status.code === 'ok')
  return <main className="min-h-screen bg-[#FAFAF8] px-5 pb-20 pt-28 sm:px-8">
    <div className="mx-auto max-w-6xl">
      <Link href="/admin" className="mb-7 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600">
        <ArrowLeft className="h-4 w-4" /> 返回管理后台
      </Link>
      <div className="mb-8 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-blue-700">
            <BookOpen className="h-4 w-4"/> AI 技术精读
          </div>
          <h1 className="text-3xl font-black tracking-tight text-gray-900">出版状态与内容一致性</h1>
          <p className="mt-3 text-sm leading-7 text-gray-500">
            只读检查最近 60 期：文章是否公开、是否符合结构化文档 Schema、
            是否与阅读器预期正文一致。此页面不调用模型，也不自动修改文章。
          </p>
        </div>
        <Link href="/learn" className="inline-flex items-center gap-2 rounded-lg border bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:border-blue-300">
          查看公开学习中心 <ExternalLink className="h-4 w-4"/>
        </Link>
      </div>

      <div className="mb-9 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border bg-white p-5">
          <p className="text-xs font-semibold text-gray-500">今日（北京时间 {now}）</p>
          <p className={'mt-2 text-lg font-bold '+(today?.status.code==='ok'?'text-emerald-700':'text-amber-700')}>
            {today ? today.status.text : '尚未发现今日专刊'}
          </p>
        </div>
        <div className="rounded-2xl border bg-white p-5">
          <p className="text-xs font-semibold text-gray-500">最近 60 期中已校验通过</p>
          <p className="mt-2 text-2xl font-black text-emerald-700">{ok.length}</p>
        </div>
        <div className="rounded-2xl border bg-white p-5">
          <p className="text-xs font-semibold text-gray-500">存在结构或正文不一致</p>
          <p className={'mt-2 text-2xl font-black '+(invalid.length?'text-red-700':'text-gray-900')}>{invalid.length}</p>
        </div>
      </div>

      {!checked.length && <p className="rounded-xl border bg-white p-6 text-sm text-gray-500">尚无技术精读专刊记录。</p>}
      <div className="space-y-3">
        {checked.map(row => <article key={row.slug} className="rounded-2xl border bg-white p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                <span>{row.edition_date}</span>
                <span>· {TOPICS[row.topic] ?? row.topic}</span>
                <span className={'inline-flex items-center gap-1 rounded-full px-2 py-1 font-semibold '+(
                  row.status.code==='ok'?'bg-emerald-50 text-emerald-700':
                  row.status.code==='draft'?'bg-amber-50 text-amber-700':'bg-red-50 text-red-700'
                )}>
                  {row.status.code==='ok' ? <CheckCircle2 className="h-3 w-3"/> :
                   row.status.code==='draft' ? <Clock className="h-3 w-3"/> :
                   <AlertTriangle className="h-3 w-3"/>}
                  {row.status.text}
                </span>
              </div>
              <h2 className="text-base font-bold text-gray-900">{row.title}</h2>
              <p className="mt-2 text-xs leading-6 text-gray-500">{row.status.detail}</p>
            </div>
            <Link href={'/blog/'+row.slug} className="shrink-0 text-sm font-semibold text-blue-700 hover:underline">
              查看文章
            </Link>
          </div>
        </article>)}
      </div>
      <p className="mt-7 text-xs leading-6 text-gray-500">
        注意：结构校验不等于原始论文事实核验；当日缺少记录可能是尚未到计划发布时间，
        也可能是当日生成任务失败，需要结合 ChatGPT 定时任务运行记录判断。
      </p>
    </div>
  </main>
}
