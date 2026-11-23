import { ChevronLeft, ChevronRight } from 'lucide-react'
import { addDays, isPlanDate } from './model'
import type { PlannedDay } from './planner'

const dayFormat = new Intl.DateTimeFormat('zh-CN', { month: 'long', day: 'numeric', timeZone: 'UTC' })
const weekdayFormat = new Intl.DateTimeFormat('zh-CN', { weekday: 'short', timeZone: 'UTC' })
const focusRing = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600'
const arrow = 'grid size-10 place-items-center rounded-md border border-slate-200 bg-white text-slate-700 enabled:hover:border-slate-400 enabled:hover:text-blue-700 disabled:opacity-40 ' + focusRing
const atMidnight = (date: string) => new Date(date + 'T00:00:00Z')

export const shortDate = (date: string) => dayFormat.format(atMidnight(date))
export const weekdayLabel = (date: string) => weekdayFormat.format(atMidnight(date))
export const plannedMinutes = (day: PlannedDay) => day.tasks.reduce((total, task) => total + task.minutes, 0)

function daySummary(day: PlannedDay, date: string, today: string) {
  if (date >= today && day.paused) return '已暂停'
  if (date >= today && day.sundayRest) return '休息'
  if (date < today || day.spent > 0 && day.tasks.length === 0) return day.spent ? `已学 ${day.spent} 分` : '无记录'
  if (!day.stage) return '未开始'
  if (!day.budget) return '休息'
  return day.tasks.length ? `${plannedMinutes(day)} 分` : day.dueCount ? '待复习' : '未排课'
}

export default function PlanCalendar({ date, monday, today, schedule, onChange }: {
  date: string
  monday: string
  today: string
  schedule: Map<string, PlannedDay>
  onChange: (date: string) => void
}) {
  const prev = addDays(date, -7)
  const next = addDays(date, 7)
  const sunday = addDays(monday, 6)
  const currentWeek = today >= monday && today <= sunday
  return <section aria-labelledby="plan-week" className="mt-7 sm:mt-9">
    <div className="flex flex-wrap items-center justify-between gap-x-5 gap-y-3">
      <div>
        <h2 id="plan-week" className="text-lg font-bold tracking-tight">{currentWeek ? '本周安排' : '每周安排'}</h2>
        <p className="mt-0.5 text-[13px] font-medium tabular-nums text-slate-600">
          {shortDate(monday)} – {shortDate(sunday)}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
        <button type="button" onClick={() => onChange(today)} disabled={today === date}
          className={'min-h-10 rounded-md px-2.5 text-sm font-semibold text-slate-700 enabled:hover:bg-slate-100 disabled:text-slate-500 ' + focusRing}>今天</button>
        <input type="date" value={date} min="1900-01-01" max="2100-12-31" aria-label="跳到指定日期"
          onChange={event => onChange(event.target.value)}
          className={'min-h-10 min-w-0 rounded-md border border-slate-200 bg-white px-2 text-sm text-slate-800 ' + focusRing} />
        <button type="button" onClick={() => onChange(prev)} disabled={!isPlanDate(prev)} className={arrow} aria-label="上一周"><ChevronLeft className="size-4" aria-hidden="true" /></button>
        <button type="button" onClick={() => onChange(next)} disabled={!isPlanDate(next)} className={arrow} aria-label="下一周"><ChevronRight className="size-4" aria-hidden="true" /></button>
      </div>
    </div>
    <ol className="mt-3 grid grid-cols-7 gap-1 rounded-xl border border-slate-200 bg-white p-1.5 sm:gap-2 sm:p-2">
      {Array.from({ length: 7 }, (_, offset) => {
        const day = addDays(monday, offset)
        const scheduleDay = schedule.get(day)!
        const summary = daySummary(scheduleDay, day, today)
        const selected = day === date
        return <li key={day} className="min-w-0">
          <button type="button" aria-pressed={selected} disabled={!isPlanDate(day)}
            aria-label={`${shortDate(day)}${weekdayLabel(day)}${day === today ? '，今天' : ''}，${summary}`}
            onClick={() => onChange(day)}
            className={`flex min-h-[5.25rem] w-full flex-col items-center justify-center gap-1 rounded-lg px-0.5 py-2 tabular-nums transition-colors sm:min-h-24 sm:items-start sm:px-4 ${selected
              ? 'bg-[#18243a] text-white' : 'text-slate-800 enabled:hover:bg-slate-100 disabled:opacity-40'} ${focusRing}`}>
            <span className={`text-[11px] font-medium sm:text-[13px] ${selected ? 'text-slate-200' : day === today ? 'text-blue-700' : 'text-slate-600'}`}>
              {day === today ? '今天' : weekdayLabel(day)}
            </span>
            <time dateTime={day} className="text-xl font-bold leading-none sm:text-2xl">{Number(day.slice(-2))}</time>
            <span className={`whitespace-nowrap text-[10px] leading-4 sm:text-xs ${selected ? 'text-slate-200' : 'text-slate-600'}`}>
              {summary.startsWith('已学 ') ? <><span className="sm:hidden">{scheduleDay.spent}分</span><span className="hidden sm:inline">{summary}</span></> : summary}
            </span>
          </button>
        </li>
      })}
    </ol>
  </section>
}
