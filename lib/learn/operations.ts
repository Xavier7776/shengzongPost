import { chinaDate, validateEdition, type Edition } from './document'
import { textVersion } from './publication-contract'

export interface PublicationRow {
  id: number | null; post_id: number | null; slug: string | null; title: string | null
  published: boolean | null; content: string | null; edition_date: string; topic: string
  document: unknown; status: string | null; created_at: string | null
}
export type Audit = {code:'ok'|'invalid'|'drift'|'draft';text:string;detail:string}
export type CheckedPublication = PublicationRow & {audit:Audit}
export function auditPublication(row: PublicationRow): Audit {
  if (row.post_id == null || row.id !== row.post_id || row.slug !== 'daily-learn-'+row.edition_date || row.status !== 'published') {
    return {code:'invalid',text:'关联异常',detail:'日期、Slug 或文章与专刊关联不一致'}
  }
  if (!row.published) return {code:'draft',text:'未公开',detail:'请检查文章发布状态'}
  const check=validateEdition(row.document)
  if (!check.ok) return {code:'invalid',text:'结构校验失败',detail:check.errors.slice(0,3).join('；')}
  const e=row.document as Edition
  if (e.date!==row.edition_date || e.topic!==row.topic || e.title!==row.title) {
    return {code:'invalid',text:'结构元数据不一致',detail:'JSON 日期、主题或标题与存储记录不一致'}
  }
  if (textVersion(e)!==row.content) return {code:'drift',text:'正文与结构数据不一致',detail:'阅读器会保留现有正文并使用安全回退'}
  return {code:'ok',text:'正常',detail:'结构、关联及正文一致；任务运行与公网状态需独立证据'}
}

// User confirmed the enabled daily task on this date; earlier expectations remain unknown.
const EXPECTED_FROM='2026-10-09'
const previousDate=(date:string,days=1)=>new Date(Date.parse(date+'T00:00:00Z')-days*86400000).toISOString().slice(0,10)
export function publicationCalendar(rows:CheckedPublication[],now:Date,publicCheck?:{slug:string;status:'public_ready'|'public_pending'}) {
  const today=chinaDate(now)
  const [hour,minute]=new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Shanghai',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(now).split(':').map(Number)
  const minutes=hour*60+minute
  return Array.from({length:30},(_,i)=>{
    const date=previousDate(today,i), publications=rows.filter(row=>row.edition_date===date), row=publications[0]
    const publicStatus=publicCheck && row?.slug===publicCheck.slug?publicCheck.status:'unknown'
    const code=publications.length>1?'invalid':row
      ? row.audit.code==='ok'&&publicStatus==='public_pending'?'public_pending':row.audit.code
      : date<EXPECTED_FROM?'unknown':i===0&&minutes<510?'not_due':i===0&&minutes<570?'waiting':'missing'
    return {date,code,slug:row?.slug??null,publicStatus,taskStatus:'unknown' as const,expected:date>=EXPECTED_FROM}
  })
}
export const CALENDAR_LABELS:Record<string,string>={ok:'已存在且合规',invalid:'内容或关联异常',drift:'正文漂移',draft:'未公开',public_pending:'公网待刷新',not_due:'未到 08:30',waiting:'出版宽限期至 09:30',missing:'尚未见刊',unknown:'出版期望未知'}
export function publicationSummary(rows:CheckedPublication[]) {
  const dates=rows.filter(row=>row.audit.code==='ok' && rows.filter(other=>other.edition_date===row.edition_date).length===1).map(row=>row.edition_date).sort().reverse()
  const latestDate=dates[0]??null
  let consecutiveDays=0
  if(latestDate)while(dates.includes(previousDate(latestDate,consecutiveDays)))consecutiveDays++
  return {latestDate,consecutiveDays}
}
