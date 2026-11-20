'use client'

import { useCallback, useEffect, useId, useMemo, useRef, useState, type FormEvent } from 'react'
import { ArrowDown, ArrowUpRight, RefreshCw, Sparkles } from 'lucide-react'
import StudyJournal from '@/features/study-records/StudyJournal'
import RecordEditor, { button, control, primary } from '@/features/study-records/RecordEditor'
import { fetchStudyRecords, writeStudyRecord } from '@/features/study-records/client'
import { limits, type Entry, type SavedEntry } from '@/features/study-records/model'
import { chinaDate } from '@/lib/learn/document'
import { stages } from './curriculum'
import { addDays, addMonths, defaultDay, defaultPlan, isPlanDate, startOfWeek, type Proposal, type SavedPlan, type StudyPlan } from './model'
import { getPlanStage, planSchedule, type PlannedTask } from './planner'
import { DayEditor, PlanSettings } from './PlanForms'
import PlanCalendar, { plannedMinutes, shortDate, weekdayLabel } from './PlanCalendar'
import PlanDay from './PlanDay'

const api = '/api/admin/study-plan'
const noRecords: readonly SavedEntry[] = []
const subtleAction = 'inline-flex min-h-10 items-center gap-1.5 rounded-md px-2 text-sm font-semibold text-slate-700 enabled:hover:bg-slate-100 disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600'
const detailsStyle = 'border-b border-slate-200'
const summaryStyle = 'cursor-pointer rounded py-3.5 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600'

async function apiData(response: Response) {
  const data = await response.json().catch(() => null)
  if (!response.ok) throw new Error(data?.error ?? '服务暂不可用，请重试。')
  return data
}

export default function StudyWorkspace({ initialPlan, initialRecords, today: initialToday, loadFailed, aiAvailable }: {
  initialPlan: SavedPlan; initialRecords: SavedEntry[] | undefined; today: string; loadFailed: boolean; aiAvailable: boolean
}) {
  const [saved, setSaved] = useState(initialPlan)
  const [recordList, setRecordList] = useState<SavedEntry[] | null | undefined>(initialRecords)
  const [recordsFailed, setRecordsFailed] = useState(false)
  const [today, setToday] = useState(initialToday)
  const [chosenDate, setChosenDate] = useState<string | null>(null)
  const [editDay, setEditDay] = useState(false)
  const [recordDraft, setRecordDraft] = useState<{
    id: string
    entry: Pick<Entry, 'title' | 'track' | 'date' | 'minutes' | 'review'>
  } | null>(null)
  const [busy, setBusy] = useState(false)
  const [unavailable, setUnavailable] = useState(loadFailed)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState(loadFailed ? '暂时无法读取已保存的计划。' : '')
  const [conflict, setConflict] = useState(loadFailed)
  const [aiOpen, setAiOpen] = useState(false)
  const [aiBusy, setAiBusy] = useState(false)
  const [aiError, setAiError] = useState('')
  const [proposal, setProposal] = useState<Proposal | null>(null)
  const [instruction, setInstruction] = useState('')
  const requestInFlight = useRef(false)
  const recordsRead = useRef<AbortController | null>(null)
  const aiRequest = useRef<AbortController | null>(null)
  const aiInput = useRef<HTMLTextAreaElement>(null)
  const recordTrigger = useRef<HTMLElement | null>(null)
  const inputId = useId()

  const snapshot = saved.snapshot
  const records = recordList ?? noRecords
  const date = chosenDate ?? today
  const monday = startOfWeek(date)
  const weekEnd = addDays(monday, 6)
  const nextDays = [1, 2, 3].map(n => addDays(date, n)).filter(isPlanDate)
  const tail = addDays(date, 3)
  const end = tail > weekEnd ? tail : weekEnd
  const schedule = useMemo(
    () => planSchedule(saved.snapshot, monday, end, today, recordList ?? noRecords),
    [saved.snapshot, monday, end, today, recordList],
  )
  const daily = schedule.get(date)!
  const currentStage = getPlanStage(snapshot.startDate, today)
  const selectedDay = snapshot.days[date] ?? defaultDay
  const preview = proposal && {
    ...snapshot,
    days: { ...snapshot.days, ...Object.fromEntries(proposal.changes.map(change => [change.date, change.day])) },
  }
  const previewDays = preview && proposal
    ? planSchedule(preview, monday, proposal.changes.at(-1)!.date, today, records) : null
  const originalDays = preview && proposal
    ? planSchedule(snapshot, monday, proposal.changes.at(-1)!.date, today, records) : null

  const refreshRecords = useCallback(async () => {
    recordsRead.current?.abort()
    const request = new AbortController()
    recordsRead.current = request
    try {
      const next = await fetchStudyRecords(request.signal)
      if (!request.signal.aborted) {
        setRecordList(next)
        setRecordsFailed(false)
      }
    } catch (failure) {
      if (request.signal.aborted) return
      setRecordList(current => current ?? null)
      setRecordsFailed(true)
      throw failure
    } finally {
      if (recordsRead.current === request) recordsRead.current = null
    }
  }, [])

  useEffect(() => {
    function refreshWhenVisible() {
      if (document.visibilityState !== 'visible') return
      setToday(chinaDate())
      if (!recordsRead.current && !requestInFlight.current) void refreshRecords().catch(() => undefined)
    }
    if (initialRecords === undefined) refreshWhenVisible()
    document.addEventListener('visibilitychange', refreshWhenVisible)
    const interval = window.setInterval(refreshWhenVisible, 60_000)
    return () => {
      window.clearInterval(interval)
      document.removeEventListener('visibilitychange', refreshWhenVisible)
      recordsRead.current?.abort()
      recordsRead.current = null
      aiRequest.current?.abort()
    }
  }, [initialRecords, refreshRecords])

  useEffect(() => { if (aiOpen) aiInput.current?.focus() }, [aiOpen])

  function clearProposal() {
    aiRequest.current?.abort()
    aiRequest.current = null
    setAiBusy(false)
    setAiError('')
    setProposal(null)
  }

  async function run<T>(request: () => Promise<T>) {
    if (requestInFlight.current) return
    requestInFlight.current = true
    setBusy(true)
    setError('')
    setNotice('')
    try {
      return await request()
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : '操作失败，请重试。')
    } finally {
      requestInFlight.current = false
      setBusy(false)
    }
  }

  function commit(next: StudyPlan, message: string) {
    return run(async () => {
      const response = await fetch(api, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ revision: saved.revision, snapshot: next }),
      })
      if (response.status === 409) setConflict(true)
      const data = await apiData(response)
      setSaved(data.plan)
      setConflict(false)
      setNotice(message)
      clearProposal()
      return true
    })
  }

  function reload() {
    return run(async () => {
      const data = await apiData(await fetch(api, { cache: 'no-store' }))
      setSaved(data.plan ?? { snapshot: defaultPlan(initialPlan.snapshot.startDate), revision: 0 })
      setUnavailable(false)
      setConflict(false)
      clearProposal()
      setNotice('已读取最新计划。')
    })
  }

  function changeDate(next: string) {
    if (!isPlanDate(next) || next === date || requestInFlight.current) return
    setChosenDate(next === today ? null : next)
    setEditDay(false)
    setRecordDraft(null)
    clearProposal()
  }

  function openRecord(task: PlannedTask) {
    recordTrigger.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    setEditDay(false)
    setRecordDraft(recordDraft?.id === task.id ? null : {
      id: task.id,
      entry: { title: task.title, date, track: task.track === 'balanced' ? 'other' : task.track,
        minutes: Math.min(task.minutes, limits.minutes), review: task.review || Boolean(task.practice) },
    })
  }

  async function saveTask(entry: Entry, id?: string) {
    await run(async () => {
      if (!id) return
      const recorded = { ...entry, id, recordedAt: Date.now() }
      await writeStudyRecord({ type: 'create', entry: recorded })
      setRecordList(previous => [...(previous ?? noRecords).filter(record => record.id !== id), { ...recorded, revision: 1 }]
        .sort((a, b) => b.date.localeCompare(a.date) || b.recordedAt - a.recordedAt))
      setRecordDraft(null)
      setNotice('学习已记录，后续安排已更新。')
      window.requestAnimationFrame(() => document.getElementById('day-plan-heading')?.focus())
      await refreshRecords().catch(() => undefined)
    })
  }

  async function ask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const message = instruction.trim()
    if (message.length < 2) {
      setAiError('请描述你想怎样调整计划。')
      return
    }
    clearProposal()
    const request = new AbortController()
    aiRequest.current = request
    setAiBusy(true)
    try {
      const data = await apiData(await fetch(api + '/ai', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: request.signal,
        body: JSON.stringify({ date, instruction: message, snapshot }),
      }))
      if (!request.signal.aborted) setProposal(data.proposal)
    } catch (failure) {
      if (!request.signal.aborted) setAiError(failure instanceof Error ? failure.message : '无法生成调整建议。')
    } finally {
      if (aiRequest.current === request) {
        aiRequest.current = null
        setAiBusy(false)
      }
    }
  }

  const disabled = busy || unavailable
  const preparing = recordDraft && recordDraft.entry.date === date
  const assistantShortcuts = ['所选日只排 45 分钟', '周末优先 STM32', '明天安排为休息日']

  return <>
    <header className="flex flex-wrap items-end justify-between gap-x-2 gap-y-3 border-b border-slate-200 pb-5 sm:gap-x-6 sm:pb-6">
      <div>
        <h1 className="text-[2.25rem] font-bold leading-tight tracking-tight text-[#142034] sm:text-5xl">学习计划</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          {currentStage ? `第 ${currentStage.month} 阶段 · ${currentStage.title}` : `六个月路线 · ${snapshot.startDate} 开始`}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-1 sm:gap-2">
        <a href="#study-records" className={subtleAction}>学习记录 <ArrowDown className="hidden size-4 sm:block" aria-hidden="true" /></a>
        <button type="button" className={button + ' !min-h-10 max-sm:gap-1 max-sm:px-2'} aria-expanded={aiOpen} aria-controls="study-assistant"
          disabled={disabled} onClick={() => {
            if (aiOpen) clearProposal()
            else if (date < today) changeDate(today)
            setAiOpen(!aiOpen)
          }}><Sparkles className="size-4 text-blue-700" aria-hidden="true" /> AI 调整</button>
      </div>
    </header>

    <PlanCalendar date={date} monday={monday} today={today} schedule={schedule} onChange={changeDate} />

    <p role="status" className={notice ? 'mt-3 text-sm font-medium text-blue-800' : 'sr-only'}>{notice}</p>
    {error && <div className="mt-4 flex flex-wrap items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2">
      <p role="alert" className="flex-1 text-sm text-red-800">{error}</p>
      {conflict && <button type="button" className={subtleAction} disabled={busy} onClick={reload}>重新读取计划</button>}
    </div>}
    {recordsFailed && <div className="mt-4 flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3">
      <p role="status" className="flex-1 text-sm text-slate-700">学习记录暂未更新，计划会在读取成功后重算。</p>
      <button type="button" className={subtleAction} onClick={() => void run(refreshRecords)} disabled={busy}>重试</button>
    </div>}

    <div className="mt-5 grid items-start gap-5 sm:mt-6 lg:grid-cols-[minmax(0,1fr)_19.5rem] lg:gap-8">
      <PlanDay date={date} today={today} day={daily} options={selectedDay} busy={disabled} canRecord={Boolean(recordList)}
        editing={editDay} activeTaskId={preparing ? recordDraft.id : undefined}
        onEdit={() => { setRecordDraft(null); setEditDay(!editDay) }} onRecord={openRecord}
        editor={editDay ? <DayEditor key={date + saved.revision} value={selectedDay} disabled={disabled} onCancel={() => setEditDay(false)}
          onReset={async () => {
            const days = { ...snapshot.days }
            delete days[date]
            if (await commit({ ...snapshot, days }, '已恢复当天的日常安排。')) setEditDay(false)
          }}
          onSave={async day => {
            if (!day) { setError('请检查当天的计划设置。'); return }
            if (await commit({ ...snapshot, days: { ...snapshot.days, [date]: day } }, '已保存当天的安排，后续计划已更新。')) setEditDay(false)
          }} /> : preparing ? <RecordEditor key={date + recordDraft.id} entry={null} draft={recordDraft.entry} today={today}
            busy={disabled} onSave={saveTask} onCancel={() => { setRecordDraft(null); recordTrigger.current?.focus() }} /> : undefined} />

      <aside className="min-w-0">
        <section id="study-assistant" hidden={!aiOpen} aria-labelledby="study-ai-heading" className="mb-5 rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
          <h2 id="study-ai-heading" className="text-lg font-bold tracking-tight">调整学习计划</h2>
          <p className="mt-1 text-xs leading-5 text-slate-600">
            {aiAvailable ? `OpenCode Go · 从 ${shortDate(date)} 起` : 'OpenCode Go 尚未连接。'}
          </p>
          <form method="post" onSubmit={ask} aria-labelledby="study-ai-heading" className="mt-4">
            <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium">你想怎样调整？</label>
            <textarea id={inputId} ref={aiInput} name="instruction" value={instruction} onChange={event => setInstruction(event.target.value)}
              required maxLength={800} rows={3} disabled={disabled || !aiAvailable} className={control}
              placeholder="例如：周六想多学一点 STM32。" />
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {assistantShortcuts.map(preset => <button key={preset} type="button" className="min-h-8 rounded-md bg-slate-100 px-2 text-xs font-medium text-slate-700 hover:bg-slate-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600"
                disabled={!aiAvailable} onClick={() => { setInstruction(preset); aiInput.current?.focus() }}>{preset}</button>)}
            </div>
            <p className="mt-3 text-xs leading-5 text-slate-600">你的要求和未来一周的任务摘要将发送给 OpenCode Go。</p>
            <button type="submit" className={primary + ' mt-3 w-full'} disabled={disabled || !aiAvailable || date < today || aiBusy}>
              {aiBusy ? '正在生成…' : '生成调整建议'}
            </button>
          </form>
          {date < today && <p className="mt-2 text-sm text-slate-600">请选择今天或之后的日期。</p>}
          {aiError && <p role="alert" className="mt-2 text-sm leading-6 text-red-800">{aiError}</p>}
          {proposal && preview && previewDays && originalDays && <div className="mt-4 border-t border-slate-200 pt-4" aria-live="polite">
            <h3 className="font-bold">调整预览</h3>
            <p className="mt-1.5 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">{proposal.explanation}</p>
            <ul className="mt-2 divide-y divide-slate-200">
              {proposal.changes.map(change => {
                const before = originalDays.get(change.date)!
                const after = previewDays.get(change.date)!
                return <li key={change.date} className="py-2 text-sm leading-6">
                  <p><time dateTime={change.date} className="font-semibold">{shortDate(change.date)}</time>
                    <span className="ml-2 text-xs tabular-nums text-slate-600">{before.budget === after.budget
                      ? `${after.budget} 分钟预算` : `预算 ${before.budget} → ${after.budget} 分钟`}</span></p>
                  {after.tasks.length > 0 ? <ul className="space-y-0.5 text-xs leading-5 text-slate-600">
                    {after.tasks.map(task => <li key={task.id} className="[overflow-wrap:anywhere]">{task.title} · {task.minutes} 分钟</li>)}
                  </ul> : <p className="text-xs text-slate-600">当天没有待学任务。</p>}
                </li>
              })}
            </ul>
            <div className="mt-2 flex flex-wrap gap-2">
              <button type="button" className={primary} disabled={disabled}
                onClick={() => void commit(preview, '已应用 AI 调整，后续安排已更新。')}>应用并保存</button>
              <button type="button" className={button} disabled={busy} onClick={clearProposal}>取消</button>
            </div>
          </div>}
        </section>

        {nextDays.length > 0 && <section aria-labelledby="next-study-days">
          <div className="flex items-center justify-between gap-2 pb-2">
            <h2 id="next-study-days" className="text-lg font-bold tracking-tight">接下来</h2>
            <button type="button" aria-label="刷新学习记录" title="刷新学习记录" className={subtleAction} disabled={busy}
              onClick={() => void run(async () => { await refreshRecords(); setNotice('学习记录与计划已更新。') })}>
              <RefreshCw className="size-4" aria-hidden="true" />
            </button>
          </div>
          <ul className="divide-y divide-slate-200 border-y border-slate-200">
            {nextDays.map(next => {
              const day = schedule.get(next)!
              const topTask = day.tasks[0]
              const label = day.spent && next < today ? '查看学习记录'
                : next < today ? '无记录' : !day.stage ? '路线尚未开始' : !day.budget ? '休息日'
                  : topTask?.title ?? (day.dueCount ? '复习将顺延' : '暂无待学任务')
              return <li key={next}>
                <button type="button" onClick={() => {
                  changeDate(next)
                  window.requestAnimationFrame(() => document.getElementById('day-plan-heading')?.focus())
                }} disabled={busy}
                  className="group flex w-full items-center justify-between gap-3 rounded px-1 py-3 text-left enabled:hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600">
                  <span className="min-w-0">
                    <span className="block text-xs font-medium leading-5 text-slate-600">{shortDate(next)} · {weekdayLabel(next)}
                      {topTask && next >= today ? ` · ${day.tasks.length} 项 / ${plannedMinutes(day)} 分钟` : ''}</span>
                    <span className="mt-0.5 block text-sm font-semibold leading-5 text-slate-800 [overflow-wrap:anywhere] group-hover:text-blue-800">{label}</span>
                  </span>
                  <ArrowUpRight className="size-4 shrink-0 text-slate-500" aria-hidden="true" />
                </button>
              </li>
            })}
          </ul>
          <p className="mt-3 text-xs leading-5 text-slate-600">新任务按天接续。学习记录更新后，复习和后续任务会重新安排。</p>
        </section>}

        <div className="mt-4">
          <details className={detailsStyle}>
            <summary className={summaryStyle}>路线与时间设置</summary>
            <PlanSettings value={snapshot} disabled={disabled} key={saved.revision} onSave={(next, imported) => {
              if (!next) { setError(imported ? '无法读取手机计划，请选择有效的 StudyPilot 备份。' : '请检查路线日期和时间预算。'); return }
              void commit(next, imported ? '已导入手机计划设置。' : '已保存开始日期和日常预算。')
            }} />
          </details>
          <details className={detailsStyle}>
            <summary className={summaryStyle}>六个月学习路线</summary>
            <ol className="divide-y divide-slate-200">
              {stages.map(stage => <li key={stage.month} className="py-3.5">
                <p className="text-sm font-semibold">{stage.month}. {stage.title}</p>
                <p className="mt-1 text-xs leading-5 text-slate-600">
                  {addMonths(snapshot.startDate, stage.month - 1)} – {addDays(addMonths(snapshot.startDate, stage.month), -1)}
                </p>
                <ul className="mt-2 space-y-1.5 text-xs leading-5 text-slate-700">
                  {[stage.algorithm, stage.backend, stage.project, stage.hardware, `阶段成果：${stage.checkpoint}`]
                    .map(text => <li key={text}>{text}</li>)}
                </ul>
              </li>)}
            </ol>
          </details>
        </div>
      </aside>
    </div>

    <section id="study-records" aria-label="学习记录" className="mt-12 scroll-mt-24 sm:mt-16">
      <StudyJournal records={recordList} refresh={refreshRecords} today={today} />
    </section>
  </>
}
