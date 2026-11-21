import { ArrowDown, ArrowUpRight, Check, PencilLine } from 'lucide-react'
import type { ReactNode } from 'react'
import { button, primary } from '@/features/study-records/RecordEditor'
import { outcomes } from '@/features/study-records/model'
import { focusLabels, type DayOverride } from './model'
import { plannedMinutes, shortDate, weekdayLabel } from './PlanCalendar'
import type { PlannedDay, PlannedTask } from './planner'
import { embeddedGuideHref, embeddedGuideHrefForTitle, embeddedIntroResource } from './embedded-guide'

export function taskLabel(task: PlannedTask) {
  if (task.id === 'custom') return '自定义任务'
  return `${task.review ? '到期复习' : task.practice ? '巩固练习' : '新学'} · ${focusLabels[task.track]}`
}

const rowAction = 'inline-flex min-h-10 items-center justify-center gap-1 rounded-md px-2 text-sm font-semibold text-blue-700 enabled:hover:bg-blue-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600 disabled:opacity-50'
const taskLink = 'inline-block rounded py-1 text-[15px] font-semibold leading-6 text-slate-900 underline-offset-4 [overflow-wrap:anywhere] hover:text-blue-700 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600'

export default function PlanDay({ date, today, day, options, busy, canRecord, editing, activeTaskId, onEdit, onRecord, editor }: {
  date: string
  today: string
  day: PlannedDay
  options: DayOverride
  busy: boolean
  canRecord: boolean
  editing: boolean
  activeTaskId?: string
  onEdit: () => void
  onRecord: (task: PlannedTask) => void
  editor?: ReactNode
}) {
  const past = date < today
  const future = date > today
  const tasks = past ? [] : day.tasks
  const duePending = day.dueCount - day.tasks.filter(task => task.review).length
  const extraUnscheduled = options.extra && day.stage && day.budget > 0 && !past
    && !tasks.some(task => task.id === 'custom') && !day.completed.some(record => record.title === options.extra?.title)
  const description = past ? `已记录 ${day.spent} 分钟` : !day.stage ? '六个月学习路线尚未开始'
    : day.budget === 0 ? '休息日' : `待学 ${plannedMinutes(day)} 分钟 · 预算 ${day.budget} 分钟${day.spent ? ` · 已学 ${day.spent} 分钟` : ''}`

  return <section aria-labelledby="day-plan-heading" className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white">
    <header className="flex flex-wrap items-start justify-between gap-3 px-4 pb-4 pt-5 sm:px-6 sm:pt-6">
      <div aria-live="polite" aria-atomic="true" className="min-w-0 flex-1">
        <h2 id="day-plan-heading" tabIndex={-1} className="text-xl font-bold tracking-tight outline-none sm:text-2xl">
          {date === today ? '今日计划' : `${shortDate(date)} · ${weekdayLabel(date)}`}
        </h2>
        <p className="mt-1.5 text-[13px] leading-5 text-slate-600">{description}</p>
      </div>
      <button type="button" className={button + ' !min-h-10'} disabled={busy} aria-expanded={editing}
        onClick={onEdit}><PencilLine className="size-3.5" aria-hidden="true" /> 调整当天</button>
    </header>
    {editing && <div className="border-t border-slate-200">{editor}</div>}
    {tasks.length > 0 && <ol className="divide-y divide-slate-200 border-t border-slate-200 px-4 sm:px-6">
      {tasks.map((task, index) => {
        const guideHref = embeddedGuideHref(task.id)
        const titleHref = guideHref ?? task.url
        const resource = embeddedIntroResource(task.id)
        const resourceUrl = resource?.url ?? (guideHref ? task.url : undefined)
        const resourceLabel = resource?.label ?? '本节教程'
        return <li key={task.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 py-3.5 sm:gap-4 sm:py-4">
          <div className="min-w-0">
            <p className={`text-xs font-medium leading-5 ${task.review ? 'text-blue-800' : 'text-slate-600'}`}>{taskLabel(task)}</p>
            {titleHref ? <a href={titleHref} target={guideHref ? undefined : '_blank'} rel={guideHref ? undefined : 'noreferrer'}
              className={taskLink}>
              {task.title} {guideHref
                ? <ArrowDown className="inline size-3.5 align-[-0.125em] text-slate-500" aria-hidden="true" />
                : <ArrowUpRight className="inline size-3.5 align-[-0.125em] text-slate-500" aria-hidden="true" />}
            </a> : <p className="py-1 text-[15px] font-semibold leading-6 text-slate-900 [overflow-wrap:anywhere]">{task.title}</p>}
            {resourceUrl && <div>
              <a href={resourceUrl} target="_blank" rel="noreferrer" aria-label={`${task.title}的${resourceLabel}`}
                className="inline-flex min-h-8 items-center gap-1 rounded text-xs font-semibold text-blue-700 underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600">
                {resourceLabel} <ArrowUpRight className="size-3 shrink-0" aria-hidden="true" />
              </a>
            </div>}
          </div>
          <div className="flex shrink-0 flex-col items-end gap-0.5 sm:flex-row sm:items-center sm:gap-4">
            <span className="whitespace-nowrap text-xs font-medium tabular-nums text-slate-600 sm:text-sm">{task.minutes} 分钟</span>
            {!future && <button type="button" aria-label={`记录 ${task.title}`} aria-expanded={activeTaskId === task.id}
              className={index === 0 ? primary + ' !min-h-10 px-2.5' : rowAction} disabled={busy || !canRecord} onClick={() => onRecord(task)}>记录</button>}
          </div>
          {activeTaskId === task.id && <div className="col-span-full [&>form]:mt-1">{editor}</div>}
        </li>
      })}
    </ol>}
    {tasks.length === 0 && (!past || !day.completed.length) && <p className="border-t border-slate-200 px-4 py-5 text-sm leading-6 text-slate-600 sm:px-6">
      {past ? '这一天没有学习记录。' : !day.stage ? '开始日期可以在「路线与时间设置」中调整。' : !day.budget ? '未完成的复习会留到下一个学习日。'
        : day.spent >= day.budget ? '当天的学习时间已用完。' : duePending > 0 ? '剩余时间不足 15 分钟，复习会顺延。'
          : '目前没有适合这段时间的任务。可以增加预算或添加自定义任务。'}
    </p>}
    {tasks.length > 0 && duePending > 0 && <p className="border-t border-slate-200 px-4 py-3 text-sm text-slate-600 sm:px-6">还有 {duePending} 项到期复习将顺延。</p>}
    {extraUnscheduled && <p className="border-t border-slate-200 px-4 py-3 text-sm leading-6 text-slate-600 sm:px-6">
      自定义任务「{options.extra?.title}」需要 {options.extra?.minutes} 分钟。增加当天预算后才能排入。
    </p>}
    {day.completed.length > 0 && <div className="border-t border-slate-200 bg-slate-50 px-4 py-4 sm:px-6">
      <h3 className="text-xs font-semibold text-slate-700">已记录 {day.completed.length} 项</h3>
      <ul className="mt-2 space-y-2">
        {[...day.completed].reverse().map(record => {
          const guideHref = record.track === 'hardware' ? embeddedGuideHrefForTitle(record.title) : undefined
          return <li key={record.id} className="flex items-start gap-2 text-sm leading-5 text-slate-700">
            <Check className="mt-0.5 size-4 shrink-0 text-blue-700" aria-hidden="true" />
            {guideHref ? <a href={guideHref} className="min-w-0 flex-1 rounded text-blue-700 underline-offset-4 [overflow-wrap:anywhere] hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600">
              {record.title} <ArrowDown className="inline size-3.5 align-[-0.125em]" aria-hidden="true" />
            </a> : <span className="min-w-0 flex-1 [overflow-wrap:anywhere]">{record.title}</span>}
            <span className="shrink-0 text-xs text-slate-600">{outcomes[record.outcome]}</span>
          </li>
        })}
      </ul>
    </div>}
  </section>
}
