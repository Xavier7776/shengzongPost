import Link from 'next/link'
import type { Metadata } from 'next'
import { ArrowLeft, BookOpen, CheckCircle2, AlertTriangle, Clock, ExternalLink } from 'lucide-react'
import { requireAdmin } from '@/lib/auth'
import { sql } from '@/lib/db/_core'
import { chinaDate, TOPICS, type Topic, type Edition } from '@/lib/learn/document'
import { publicVisibility } from '@/lib/learn/publish'
import { auditPublication, publicationCalendar, publicationSummary, CALENDAR_LABELS, type PublicationRow } from '@/lib/learn/operations'
import PublicationAlerts from '@/components/admin/PublicationAlerts'

export const dynamic = 'force-dynamic'
export const maxDuration = 30
export const metadata: Metadata = {
  title: '技术精读发布健康度 · 管理后台',
  robots: { index: false, follow: false },
}

export default async function AdminLearnPage() {
  await requireAdmin() // privilege check before any database read
  let rows:Record<string,unknown>[]=[]
  let databaseStatus='已观察'
  try {
    rows = await sql`SELECT p.id,l.post_id,p.slug,p.title,p.published,p.content,p.created_at::text,
      COALESCE(l.edition_date::text,substring(p.slug from '^daily-learn-([0-9]{4}-[0-9]{2}-[0-9]{2})$')) AS edition_date,
      l.topic,l.document,l.status
    FROM learn_editions l FULL OUTER JOIN posts p ON p.id=l.post_id
    WHERE l.post_id IS NOT NULL OR p.slug LIKE 'daily-learn-%'
    ORDER BY edition_date DESC NULLS LAST LIMIT 60`
  } catch {
    databaseStatus='数据库观察失败；不能判定缺刊'
    console.error('[learn] database observation failed', {category:'database_unavailable'})
  }
  const observedAt=new Date()
  const started=performance.now()
  const checked = (rows as unknown as PublicationRow[]).map(row => ({ ...row, audit: auditPublication(row) }))
  const duration=Math.round(performance.now()-started)
  const summary=publicationSummary(checked)
  const latest=checked.find(row=>row.edition_date===summary.latestDate && row.audit.code==='ok')
  const publicCheck=latest?.slug?{slug:latest.slug,status:await publicVisibility(latest.document as Edition)}:undefined
  const calendar=publicationCalendar(checked,observedAt,publicCheck)
  const alerts=databaseStatus==='已观察'?calendar.filter(day=>['missing','invalid','drift','draft','public_pending'].includes(day.code)).map(day=>({key:day.date+':'+day.code,text:day.date+'：'+CALENDAR_LABELS[day.code]})):[]
  const now = chinaDate(observedAt)
  const today = checked.find(row => row.edition_date === now)
  const invalid = checked.filter(row => row.audit.code === 'invalid' || row.audit.code === 'drift')
  const ok = checked.filter(row => row.audit.code === 'ok')
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

      <PublicationAlerts alerts={alerts}/>
      <p className="mb-5 text-xs leading-6 text-gray-500">数据库：{databaseStatus} · 检查时间 {observedAt.toLocaleString('zh-CN',{timeZone:'Asia/Shanghai'})} 北京时间 · 结构检查 {duration}ms · 任务历史：unknown（无独立审计） · 公网：{publicCheck?.status??'unknown'}</p>
      <div className="mb-9 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border bg-white p-5">
          <p className="text-xs font-semibold text-gray-500">今日（北京时间 {now}）</p>
          <p className={'mt-2 text-lg font-bold '+(today?.audit.code==='ok'?'text-emerald-700':'text-amber-700')}>
            {databaseStatus!=='已观察'?'观察不可用':CALENDAR_LABELS[calendar[0].code]}
          </p>
        </div>
        <div className="rounded-2xl border bg-white p-5">
          <p className="text-xs font-semibold text-gray-500">最近 60 期中已校验通过</p>
          <p className="mt-2 text-2xl font-black text-emerald-700">{databaseStatus==='已观察'?ok.length:'未知'}</p>
        </div>
        <div className="rounded-2xl border bg-white p-5">
          <p className="text-xs font-semibold text-gray-500">存在结构或正文不一致</p>
          <p className={'mt-2 text-2xl font-black '+(invalid.length?'text-red-700':'text-gray-900')}>{databaseStatus==='已观察'?invalid.length:'未知'}</p>
        </div>
      </div>

      <section className="mb-9 rounded-2xl border bg-white p-5">
        <h2 className="font-bold">最近 7 / 30 天出版日历</h2>
        <p className="mt-2 text-sm leading-7 text-gray-500">最近一次内容合规日期：{summary.latestDate??'未知'} · 至该日连续出版：{summary.consecutiveDays} 天。2026-10-09 起确认应每日出版；此前期望未知。08:30 前未到窗口，宽限至 09:30。只有最近一次合规刊物执行公网 GET，其余公网状态未知。</p>
        <details open className="mt-4">
          <summary className="cursor-pointer text-sm font-semibold">最近 7 天</summary>
          <ul className="mt-3 space-y-2 text-sm">{calendar.slice(0,7).map(day=><li key={day.date} className="flex flex-wrap justify-between gap-2 border-b pb-2"><time>{day.date}</time><span>{databaseStatus==='已观察'?CALENDAR_LABELS[day.code]:'数据库观察不可用'} · 任务 unknown · 公网 {day.publicStatus}</span></li>)}</ul>
        </details>
        <details className="mt-4">
          <summary className="cursor-pointer text-sm font-semibold">展开完整 30 天</summary>
          <ul className="mt-3 space-y-2 text-sm">{calendar.map(day=><li key={day.date}>{day.date} · {databaseStatus==='已观察'?CALENDAR_LABELS[day.code]:'数据库观察不可用'} · 任务 unknown · 公网 {day.publicStatus}</li>)}</ul>
        </details>
      </section>

      {!checked.length && <p className="rounded-xl border bg-white p-6 text-sm text-gray-500">{databaseStatus==='已观察'?'尚无技术精读专刊记录。':'数据库不可用，刊物数量未知。'}</p>}
      <div className="space-y-3">
        {checked.map((row,index) => <article key={row.slug??'orphan-'+index} className="rounded-2xl border bg-white p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                <span>{row.edition_date}</span>
                <span>· {TOPICS[row.topic as Topic] ?? row.topic}</span>
                <span className={'inline-flex items-center gap-1 rounded-full px-2 py-1 font-semibold '+(
                  row.audit.code==='ok'?'bg-emerald-50 text-emerald-700':
                  row.audit.code==='draft'?'bg-amber-50 text-amber-700':'bg-red-50 text-red-700'
                )}>
                  {row.audit.code==='ok' ? <CheckCircle2 className="h-3 w-3"/> :
                   row.audit.code==='draft' ? <Clock className="h-3 w-3"/> :
                   <AlertTriangle className="h-3 w-3"/>}
                  {row.audit.text}
                </span>
              </div>
              <h2 className="text-base font-bold text-gray-900">{row.title}</h2>
              <p className="mt-2 text-xs leading-6 text-gray-500">{row.audit.detail}</p>
            </div>
            {row.slug && <Link href={'/blog/'+row.slug} className="shrink-0 text-sm font-semibold text-blue-700 hover:underline">
              查看文章
            </Link>}
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
