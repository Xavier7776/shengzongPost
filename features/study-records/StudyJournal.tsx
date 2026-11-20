'use client'

import { useCallback, useRef, useState, type ChangeEvent } from 'react'
import { Download, LockKeyhole, NotebookPen, Plus, Search, Upload } from 'lucide-react'
import { decodeBackup, encodeBackup } from './backup'
import { fetchStudyRecords, writeStudyRecord as save } from './client'
import { importBatchSize, maxBackupBytes, outcomes, tracks, type Entry, type SavedEntry } from './model'
import RecordEditor, { button, control, primary } from './RecordEditor'
import StudySyncPanel from './StudySyncPanel'
import { startOfWeek } from '@/features/study-plan/model'

const pageSize = 20
const icon = 'h-4 w-4 shrink-0'
const rowButton = 'inline-flex min-h-12 items-center justify-center whitespace-nowrap rounded-md px-2.5 text-sm font-medium text-slate-600 transition-colors enabled:hover:bg-blue-50 enabled:hover:text-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600 disabled:opacity-50'
const label = 'mb-1.5 block text-sm font-medium text-slate-700'
const statValue = 'font-mono text-xl font-medium leading-tight tabular-nums lg:text-2xl'
const statUnit = 'ml-1 font-sans text-xs font-medium text-slate-600 sm:text-sm'

function minutesLabel(minutes: number) {
  const hours = Math.floor(minutes / 60)
  const remainder = minutes % 60
  return (
    <span className="flex flex-wrap items-baseline gap-x-1.5">
      {hours > 0 && <span className="whitespace-nowrap">{hours}<span className={statUnit}>小时</span></span>}
      {(hours === 0 || remainder > 0) && <span className="whitespace-nowrap">{remainder}<span className={statUnit}>分钟</span></span>}
    </span>
  )
}

export default function StudyJournal({ records, refresh, today }: {
  records: SavedEntry[] | null | undefined
  refresh: () => Promise<void>
  today: string
}) {
  const fileInput = useRef<HTMLInputElement>(null)
  const addButton = useRef<HTMLButtonElement>(null)
  const inFlight = useRef(false)
  const [editor, setEditor] = useState<{ entry: SavedEntry | null } | null>(null)
  const [pendingDelete, setPendingDelete] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const [track, setTrack] = useState('all')
  const [query, setQuery] = useState('')
  const [visible, setVisible] = useState(pageSize)

  const all = records ?? []
  const monday = startOfWeek(today)
  const weekMinutes = all.reduce((total, record) => total + (record.date >= monday && record.date <= today ? record.minutes : 0), 0)
  const keyword = query.trim().toLocaleLowerCase()
  const filtered = all.filter(record => (track === 'all' || record.track === track)
    && (!keyword || record.title.toLocaleLowerCase().includes(keyword) || record.note.toLocaleLowerCase().includes(keyword)))
  const byDate = new Map<string, SavedEntry[]>()
  for (const record of filtered.slice(0, visible)) {
    const group = byDate.get(record.date)
    if (group) group.push(record)
    else byDate.set(record.date, [record])
  }

  const refreshFromSync = useCallback(async () => {
    if (inFlight.current) return
    await refresh()
  }, [refresh])

  async function run(work: () => Promise<void>) {
    if (inFlight.current) return
    inFlight.current = true
    setBusy(true)
    setError('')
    setStatus('')
    try {
      await work()
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : '操作失败，请重试。')
    } finally {
      inFlight.current = false
      setBusy(false)
    }
  }

  function closeEditor() {
    setEditor(null)
    window.requestAnimationFrame(() => addButton.current?.focus())
  }

  async function saveEntry(entry: Entry, id?: string) {
    await run(async () => {
      const current = editor?.entry
      await save(current
        ? { type: 'update', id: current.id, revision: current.revision, entry }
        : { type: 'create', entry: { ...entry, id, recordedAt: Date.now() } })
      closeEditor()
      setStatus('学习记录已保存。')
      await refresh()
    })
  }

  async function remove(record: SavedEntry) {
    await run(async () => {
      await save({ type: 'delete', id: record.id, revision: record.revision })
      setPendingDelete(null)
      if (editor?.entry?.id === record.id) closeEditor()
      setStatus('学习记录已删除。')
      await refresh()
    })
  }

  async function importFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0]
    event.currentTarget.value = ''
    if (!file) return
    await run(async () => {
      if (file.size > maxBackupBytes) throw new Error('请选择小于 32 MB 的学习记录备份。')
      const backup = decodeBackup(await file.text())
      if (backup.length === 0) {
        setStatus('备份里没有学习记录。')
        return
      }
      let inserted = 0
      let processed = 0
      try {
        for (; processed < backup.length; processed += importBatchSize) {
          setStatus('正在导入 ' + Math.min(processed + importBatchSize, backup.length) + ' / ' + backup.length + ' 条…')
          const result = await save({ type: 'import', records: backup.slice(processed, processed + importBatchSize) })
          inserted += result.inserted
        }
      } catch (failure) {
        setStatus(processed > 0 ? '已新增 ' + inserted + ' 条。可以重新选择同一文件，继续导入。' : '')
        try { await refresh() } catch { /* The import message is more actionable. */ }
        throw failure
      }
      setStatus('新增 ' + inserted + ' 条，跳过 ' + (backup.length - inserted) + ' 条已有记录。')
      await refresh()
    })
  }

  async function exportFile() {
    await run(async () => {
      const saved = await fetchStudyRecords()
      const objectUrl = URL.createObjectURL(new Blob([encodeBackup(saved)], { type: 'application/json;charset=utf-8' }))
      const link = document.createElement('a')
      link.href = objectUrl
      link.download = '学习记录-' + today + '.json'
      link.click()
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000)
      setStatus('已生成 ' + saved.length + ' 条学习记录的备份。')
    })
  }

  if (records === undefined) return <p role="status" className="text-sm text-slate-600">正在读取学习记录…</p>

  return <>
    <header className="flex flex-wrap items-end justify-between gap-x-8 gap-y-5 border-b border-[#e5e9f0] pb-6 sm:pb-8">
      <div>
        <h2 className="text-2xl font-bold leading-tight tracking-tight sm:text-3xl">学习记录</h2>
        <p className="mt-2.5 flex items-center gap-2 text-sm leading-6 text-slate-600">
          <LockKeyhole className="size-3.5 shrink-0" aria-hidden="true" /> 仅当前管理员账号可见
        </p>
      </div>
      <div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <button ref={addButton} type="button" className={primary} disabled={busy || records === null} aria-expanded={Boolean(editor)}
            onClick={() => { setError(''); setEditor({ entry: null }) }}>
            <Plus className={icon} aria-hidden="true" /> 记一条
          </button>
          <input type="file" accept=".json,application/json" hidden ref={fileInput} onChange={importFile} />
          <button type="button" className={rowButton + ' gap-2'} disabled={busy || records === null}
            aria-describedby="study-backup-hint" onClick={() => fileInput.current?.click()}>
            <Upload className="hidden size-4 shrink-0 min-[370px]:block" aria-hidden="true" /> 导入备份
          </button>
          <button type="button" className={rowButton + ' gap-2'} disabled={busy || !all.length} onClick={exportFile}>
            <Download className="hidden size-4 shrink-0 min-[370px]:block" aria-hidden="true" /> 导出记录
          </button>
        </div>
        <p id="study-backup-hint" className="mt-2 text-xs leading-5 text-slate-600">可导入 StudyPilot 手机备份或网页备份。</p>
      </div>
    </header>
    <StudySyncPanel onSync={refreshFromSync} />
    <p role="status" className={status ? 'mt-4 text-sm font-medium text-[#3858bb]' : 'sr-only'}>{status}</p>
    {(error || records === null) && <div className="mt-4 flex flex-wrap items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-2">
      <p role="alert" className="text-sm text-red-800">{error || '暂时无法读取学习记录。'}</p>
      <button type="button" className={rowButton} disabled={busy} onClick={() => run(refresh)}>重新读取</button>
    </div>}

    {editor && <RecordEditor key={editor.entry?.id ?? 'new'} entry={editor.entry} today={today} busy={busy} onSave={saveEntry} onCancel={closeEditor} />}

    {records !== null && <div className="mt-7 grid gap-7 sm:mt-9 lg:grid-cols-[minmax(0,1fr)_15.5rem] lg:gap-9">
      <aside aria-labelledby="study-overview" className="min-w-0 lg:col-start-2 lg:row-start-1">
        <h2 id="study-overview" className="text-lg font-bold tracking-tight lg:text-xl">学习概览</h2>
        <dl className="mt-3 grid grid-cols-3 gap-3 border-y border-[#e5e9f0] py-3 sm:gap-5 lg:mt-4 lg:grid-cols-1 lg:gap-0 lg:divide-y lg:divide-[#e5e9f0] lg:py-0">
          <div className="min-w-0 lg:flex lg:items-baseline lg:justify-between lg:gap-3 lg:py-4">
            <dt className="mb-1.5 text-xs text-slate-600 sm:text-sm lg:mb-0">本周用时</dt>
            <dd className={statValue}>{minutesLabel(weekMinutes)}</dd>
          </div>
          <div className="min-w-0 lg:flex lg:items-baseline lg:justify-between lg:gap-3 lg:py-4">
            <dt className="mb-1.5 text-xs text-slate-600 sm:text-sm lg:mb-0">累计学习</dt>
            <dd className={statValue}>{new Set(all.map(record => record.date)).size}<span className={statUnit}>天</span></dd>
          </div>
          <div className="min-w-0 lg:flex lg:items-baseline lg:justify-between lg:gap-3 lg:py-4">
            <dt className="mb-1.5 text-xs text-slate-600 sm:text-sm lg:mb-0">累计记录</dt>
            <dd className={statValue}>{all.length}<span className={statUnit}>条</span></dd>
          </div>
        </dl>
      </aside>

      <section aria-labelledby="study-history" className="min-w-0 lg:col-start-1 lg:row-start-1">
        <h2 id="study-history" className="text-lg font-bold tracking-tight lg:text-xl">历史记录</h2>
        <div className="mt-3 rounded-xl border border-[#e5e9f0] bg-white lg:mt-4">
          {all.length > 0 && <search aria-label="筛选学习记录" className="grid gap-3 border-b border-[#e5e9f0] px-4 py-4 min-[380px]:grid-cols-[minmax(0,1fr)_7rem] sm:grid-cols-[minmax(0,1fr)_10rem] sm:px-6">
            <div>
              <label htmlFor="study-query" className={label}>搜索</label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" aria-hidden="true" />
                <input id="study-query" name="query" type="search" placeholder="搜索内容或笔记" className={control + ' pl-9'} value={query}
                  onChange={event => { setQuery(event.target.value); setVisible(pageSize) }} />
              </div>
            </div>
            <div>
              <label htmlFor="study-track" className={label}>学习方向</label>
              <select id="study-track" name="track" className={control} value={track}
                onChange={event => { setTrack(event.target.value); setVisible(pageSize) }}>
                <option value="all">全部方向</option>
                {Object.entries(tracks).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </div>
          </search>}

          {!filtered.length && <div className="px-4 py-9 sm:px-6">
            <NotebookPen className="mb-3 size-5 text-[#3858bb]" aria-hidden="true" />
            <p className="font-bold">{all.length ? '没有符合条件的记录' : '还没有学习记录'}</p>
            <p className="mt-1.5 text-sm leading-6 text-slate-600">{all.length ? '试试其他关键词或学习方向。' : '记下今天学了什么，或导入 StudyPilot 手机备份。'}</p>
          </div>}

          <div className="divide-y divide-[#e5e9f0] px-4 sm:px-6">
            {[...byDate].map(([date, group]) => <section key={date} className="py-4 md:grid md:grid-cols-[7rem_minmax(0,1fr)] md:gap-5 md:py-5">
              <h3 className="mb-2.5 flex flex-wrap items-baseline gap-x-2 gap-y-1 self-start text-[13px] font-medium leading-6 text-slate-600 md:mb-0">
                <time dateTime={date} className="font-mono tabular-nums">{date}</time>
                {date === today && <span className="text-xs font-medium text-[#3858bb] md:basis-full">今天</span>}
              </h3>
              <ul className="divide-y divide-[#e5e9f0]">
                {group.map(record => <li key={record.id} className="py-4 first:pt-0 last:pb-0">
                  <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-1 sm:gap-x-4">
                    <div className="min-w-0">
                      <h4 className="font-bold leading-6 [overflow-wrap:anywhere]">{record.title}</h4>
                      <p className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs leading-6 text-slate-600 sm:text-sm">
                        <span className="font-medium text-[#3858bb]">{tracks[record.track]}</span>
                        <span className="tabular-nums">{record.minutes} 分钟</span>
                        <span className={record.outcome === 'again' ? 'font-medium text-amber-800' : ''}>{outcomes[record.outcome]}</span>
                        {record.review && <span className="rounded bg-slate-100 px-1.5 leading-5">复习</span>}
                      </p>
                    </div>
                    <div className="-mr-2.5 -mt-2.5 flex">
                      <button type="button" className={rowButton} disabled={busy} aria-label={'编辑 ' + record.title}
                        onClick={() => { setError(''); setEditor({ entry: record }); setPendingDelete(null) }}>编辑</button>
                      <button type="button" className={rowButton} disabled={busy} aria-label={'删除 ' + record.title}
                        aria-expanded={pendingDelete === record.id} onClick={() => setPendingDelete(previous => previous === record.id ? null : record.id)}>删除</button>
                    </div>
                  </div>
                  {record.note && <p className="mt-1.5 max-w-[65ch] whitespace-pre-wrap text-sm leading-7 text-slate-700 [overflow-wrap:anywhere]">{record.note}</p>}
                  {pendingDelete === record.id && <div className="mt-2 flex flex-wrap items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-900">
                    <p className="mr-auto">删除这条学习记录？</p>
                    <button type="button" className={rowButton} disabled={busy} onClick={() => setPendingDelete(null)}>取消</button>
                    <button type="button" className={rowButton + ' text-red-800'} disabled={busy} onClick={() => remove(record)}>确认删除</button>
                  </div>}
                </li>)}
              </ul>
            </section>)}
          </div>
        </div>

        {filtered.length > visible && <button type="button" className={button + ' mt-4'} onClick={() => setVisible(visible + pageSize)}>
          显示更多（剩余 {filtered.length - visible} 条）
        </button>}
      </section>
    </div>}
  </>
}
