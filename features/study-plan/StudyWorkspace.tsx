'use client'

import { useId, useRef, useState, type FormEvent } from 'react'
import { ArrowDown, ArrowUpRight, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react'
import StudyJournal from '@/features/study-records/StudyJournal'
import { button, control, primary } from '@/features/study-records/RecordEditor'
import type { SavedEntry } from '@/features/study-records/model'
import { stages } from './curriculum'
import { addDays, addMonths, defaultDay, defaultPlan, focusLabels, isPlanDate, modeLabels,
  type Proposal, type SavedPlan, type StudyPlan } from './model'
import { planDay } from './planner'
import { DayEditor, PlanSettings } from './PlanForms'

const api = '/api/admin/study-plan'
const panel = 'rounded-xl border border-slate-200 bg-white'
const buttonIcon = 'inline-flex size-12 shrink-0 items-center justify-center rounded-lg border border-slate-300 text-slate-600 enabled:hover:border-blue-400 enabled:hover:text-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600 disabled:opacity-50'

async function apiData(response: Response) {
  const data = await response.json().catch(() => null)
  if (!response.ok) throw new Error(data?.error ?? '服务暂不可用，请重试。')
  return data
}

export default function StudyWorkspace({ initialPlan, initialRecords, today, loadFailed, aiAvailable }: {
  initialPlan: SavedPlan; initialRecords: SavedEntry[] | undefined; today: string; loadFailed: boolean; aiAvailable: boolean
}) {
  const [saved, setSaved] = useState(initialPlan)
  const [records, setRecords] = useState(initialRecords ?? [])
  const [date, setDate] = useState(today)
  const [editDay, setEditDay] = useState(false)
  const [busy, setBusy] = useState(false)
  const [unavailable, setUnavailable] = useState(loadFailed)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState(loadFailed ? '暂时无法读取已保存的计划。' : '')
  const [proposal, setProposal] = useState<Proposal | null>(null)
  const [instruction, setInstruction] = useState('')
  const requestInFlight = useRef(false)
  const inputId = useId()

  const snapshot = saved.snapshot
  const daily = planDay(snapshot, date, records)
  const todaySelected = date === today
  const selectedDay = snapshot.days[date] ?? defaultDay
  const planned = daily.tasks.reduce((total, task) => total + task.minutes, 0)
  const preview = proposal && {
    ...snapshot,
    days: { ...snapshot.days, ...Object.fromEntries(proposal.changes.map(change => [change.date, change.day])) },
  }

  async function run<T>(request: () => Promise<T>) {
    if (requestInFlight.current) return
    requestInFlight.current = true
    setBusy(true)
    setError('')
    setNotice('')
    try { return await request() } catch (failure) {
      setError(failure instanceof Error ? failure.message : '操作失败，请重试。')
    } finally {
      requestInFlight.current = false
      setBusy(false)
    }
  }

  async function commit(next: StudyPlan, message: string) {
    return run(async () => {
      const data = await apiData(await fetch(api, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ revision: saved.revision, snapshot: next }),
      }))
      setSaved(data.plan)
      setNotice(message)
      setProposal(null)
      return true
    })
  }

  function reload() {
    return run(async () => {
      const data = await apiData(await fetch(api, { cache: 'no-store' }))
      setSaved(data.plan ?? { snapshot: defaultPlan(initialPlan.snapshot.startDate), revision: 0 })
      setUnavailable(false)
      setProposal(null)
      setNotice('已读取最新计划。')
    })
  }

  function changeDate(next: string) {
    if (!isPlanDate(next)) return
    setDate(next)
    setEditDay(false)
    setProposal(null)
  }

  function ask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const message = instruction.trim()
    if (message.length < 2) {
      setError('请描述你想怎样调整计划。')
      return
    }
    void run(async () => {
      setProposal(null)
      const data = await apiData(await fetch(api + '/ai', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, instruction: message, snapshot }),
      }))
      setProposal(data.proposal)
    })
  }

  function applyProposal() {
    if (preview) void commit(preview, '已保存 AI 建议中的调整。')
  }

  const disabled = busy || unavailable

  return <>
    <header className="flex flex-wrap items-end justify-between gap-3 border-b border-slate-200 pb-6 sm:pb-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">学习计划</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          {daily.stage ? `第 ${daily.stage.month} 阶段 · ${daily.stage.title}` : `路线从 ${snapshot.startDate} 开始`}
        </p>
      </div>
      <a href="#study-records" className="inline-flex min-h-12 items-center gap-2 rounded px-2 text-sm font-medium text-blue-700 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600">
        学习记录 <ArrowDown className="size-4" aria-hidden="true" />
      </a>
    </header>

    <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap items-center gap-2" aria-label="选择计划日期">
        <button type="button" onClick={() => changeDate(addDays(date, -1))} className={buttonIcon} disabled={busy} aria-label="前一天"><ChevronLeft className="size-4" aria-hidden="true" /></button>
        <input type="date" value={date} min="1900-01-01" max="2100-12-31" aria-label="计划日期" onChange={event => changeDate(event.target.value)} disabled={busy} className="min-h-12 min-w-0 rounded-lg border border-slate-500 bg-white px-2.5 text-base focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600" />
        <button type="button" onClick={() => changeDate(addDays(date, 1))} className={buttonIcon} disabled={busy} aria-label="后一天"><ChevronRight className="size-4" aria-hidden="true" /></button>
        {!todaySelected && <button type="button" onClick={() => changeDate(today)} className={button} disabled={busy}>回到今天</button>}
      </div>
    </div>

    <p role="status" className={notice ? 'mt-4 text-sm text-blue-800' : 'sr-only'}>{notice}</p>
    {error && <div className="mt-4 flex flex-wrap items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3">
      <p role="alert" className="flex-1 text-sm text-red-800">{error}</p>
      <button type="button" className={button} disabled={busy} onClick={reload}>重新读取计划</button>
    </div>}

    <div className="mt-5 grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_21rem]">
      <section aria-labelledby="day-plan-heading" className={panel}>
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-4 sm:px-6">
          <div>
            <h2 id="day-plan-heading" className="text-xl font-bold tracking-tight">{todaySelected ? '今日计划' : '当日计划'}</h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">预算 {daily.budget} 分钟 · 已记录 {daily.spent} 分钟 · 待学 {planned} 分钟</p>
          </div>
          <button type="button" className={button} disabled={disabled} aria-expanded={editDay}
            onClick={() => setEditDay(!editDay)}>调整当天</button>
        </header>
        {editDay && <DayEditor key={date + saved.revision} value={selectedDay} disabled={disabled} onCancel={() => setEditDay(false)}
          onReset={async () => {
            const days = { ...snapshot.days }
            delete days[date]
            if (await commit({ ...snapshot, days }, '已恢复当天的日常安排。')) setEditDay(false)
          }}
          onSave={async day => {
            if (!day) { setError('请检查当天的计划设置。'); return }
            if (await commit({ ...snapshot, days: { ...snapshot.days, [date]: day } }, '已保存当天的安排。')) setEditDay(false)
          }} />}
        {daily.tasks.length > 0 ? <ol className="divide-y divide-slate-200 px-4 sm:px-6">
          {daily.tasks.map(task => <li className="flex items-start justify-between gap-3 py-4" key={task.id}>
            <div className="min-w-0">
              <p className="text-xs font-medium leading-5 text-blue-800">
                {task.id === 'custom' ? '自定义任务' : `${task.review ? '复习' : '新学'} · ${focusLabels[task.track]}`}
              </p>
              <p className="mt-1.5 font-semibold leading-6 [overflow-wrap:anywhere]">{task.title}</p>
              {task.url && <a href={task.url} target="_blank" rel="noreferrer" className="mt-1 inline-flex min-h-10 items-center gap-1 text-sm text-blue-700 hover:underline">
                打开资料 <ArrowUpRight className="size-3.5" aria-hidden="true" />
              </a>}
            </div>
            <span className="shrink-0 pt-1 text-right font-mono text-sm leading-5 text-slate-700">{task.minutes} <span className="font-sans">分钟</span></span>
          </li>)}
        </ol> : <p className="px-4 py-7 text-sm leading-6 text-slate-600 sm:px-6">
          {!daily.stage ? `计划将从 ${snapshot.startDate} 开始。` : daily.budget === 0
            ? '这一天安排了休息。' : daily.spent >= daily.budget ? '当天的学习时间已用完。' : '剩余时间内暂无合适的学习任务，可以调整预算或添加自定义任务。'}
        </p>}
        {selectedDay.extra && !daily.tasks.some(task => task.id === 'custom')
          && !records.some(record => record.date === date && record.title === selectedDay.extra?.title)
          && daily.stage && daily.budget > 0 && <p className="border-t border-slate-200 px-4 py-3 text-sm text-slate-600 sm:px-6">
            自定义任务「{selectedDay.extra.title}」需要 {selectedDay.extra.minutes} 分钟。可以增加当天预算，为它留出时间。
          </p>}
      </section>

      <section className={panel + ' p-4 sm:p-5'} aria-labelledby="study-ai-heading">
        <h2 id="study-ai-heading" className="flex items-center gap-2 text-lg font-bold tracking-tight">
          <Sparkles className="size-4 text-blue-700" aria-hidden="true" /> AI 调整
        </h2>
        <p className="mt-1 text-sm leading-6 text-slate-600">
          {aiAvailable ? 'OpenCode Go · GLM-5.3 Flash' : 'OpenCode Go 尚未连接。'}
        </p>
        <form method="post" onSubmit={ask} aria-labelledby="study-ai-heading" className="mt-4">
          <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium">你想怎样调整？</label>
          <textarea id={inputId} name="instruction" value={instruction} onChange={event => setInstruction(event.target.value)}
            required maxLength={800} rows={4} disabled={disabled || !aiAvailable} className={control}
            placeholder="例如：今天只有 45 分钟，周末优先 STM32。" />
          <p className="mt-2 text-xs leading-5 text-slate-600">生成建议时会将你的要求和接下来一周的任务摘要发送给 OpenCode Go。</p>
          <button type="submit" className={primary + ' mt-3 w-full'} disabled={disabled || !aiAvailable}>生成调整建议</button>
          {busy && <p role="status" className="mt-2 text-xs text-slate-600">正在处理…</p>}
        </form>
        {proposal && preview && <div className="mt-5 border-t border-slate-200 pt-4" aria-live="polite">
          <h3 className="font-bold">调整预览</h3>
          <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">{proposal.explanation}</p>
          <ul className="mt-3 divide-y divide-slate-200">
            {proposal.changes.map(change => {
              const { tasks } = planDay(preview, change.date, records)
              return <li key={change.date} className="py-2 text-sm leading-6">
                <time className="font-mono font-medium" dateTime={change.date}>{change.date}</time>
                <p>{modeLabels[change.day.mode]} · {change.day.minutes === null ? '日常预算' : change.day.minutes + ' 分钟'} · {focusLabels[change.day.focus]}</p>
                {tasks.length > 0 && <ul className="mt-1 space-y-0.5 text-slate-600">
                  {tasks.map(task => <li key={task.id} className="break-words">{task.title} · {task.minutes} 分钟</li>)}
                </ul>}
              </li>
            })}
          </ul>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" className={primary} onClick={applyProposal} disabled={disabled}>应用并保存</button>
            <button type="button" className={button} onClick={() => setProposal(null)} disabled={busy}>取消</button>
          </div>
        </div>}
      </section>
    </div>

    <details className={panel + ' mt-5 px-4 py-3 sm:px-6'}>
      <summary className="cursor-pointer rounded py-2 font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600">路线与时间设置</summary>
      <PlanSettings value={snapshot} disabled={disabled} key={saved.revision} onSave={(next, imported) => {
        if (!next) { setError(imported ? '无法读取手机计划，请选择有效的 StudyPilot 备份。' : '请检查路线日期和时间预算。'); return }
        void commit(next, imported ? '已导入手机计划设置。' : '已保存开始日期和日常预算。')
      }} />
    </details>

    <details className={panel + ' mt-3 px-4 py-3 sm:px-6'}>
      <summary className="cursor-pointer rounded py-2 font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600">六个月学习路线</summary>
      <ol className="mt-3 divide-y divide-slate-200">
        {stages.map(stage => <li key={stage.month} className="py-4">
          <p className="font-semibold">{stage.title}{stage.month === daily.stage?.month && <span className="ml-2 text-xs text-blue-700">当前阶段</span>}</p>
          <p className="mt-1 font-mono text-xs leading-6 text-slate-600">{addMonths(snapshot.startDate, stage.month - 1)} — {addDays(addMonths(snapshot.startDate, stage.month), -1)}</p>
          <dl className="mt-2 grid gap-3 text-sm leading-6 text-slate-700 sm:grid-cols-2">
            {([['算法', stage.algorithm], ['Java 后端', stage.backend], ['项目实践', stage.project], ['嵌入式与硬件', stage.hardware]] as const).map(([topic, text]) => <div key={topic}>
              <dt className="font-medium">{topic}</dt><dd>{text}</dd>
            </div>)}
          </dl>
          <p className="mt-3 text-sm leading-6 text-slate-600">阶段成果：{stage.checkpoint}</p>
        </li>)}
      </ol>
    </details>

    <section id="study-records" aria-label="学习记录" className="mt-12 scroll-mt-24">
      <StudyJournal initialRecords={initialRecords} onRecordsChange={setRecords} />
    </section>
  </>
}
