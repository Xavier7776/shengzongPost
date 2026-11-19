'use client'

import { useRef, useState, type ChangeEvent } from 'react'
import { Download, NotebookPen, Plus, Upload } from 'lucide-react'
import { decodeBackup, encodeBackup } from './backup'
import { importBatchSize, maxBackupBytes, outcomes, tracks, type Entry, type SavedEntry } from './model'
import RecordEditor, { button, control, primary } from './RecordEditor'

const endpoint = '/api/admin/study-records'
const pageSize = 20
const icon = 'h-4 w-4 shrink-0'
const rowButton = 'inline-flex min-h-12 items-center rounded px-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600 disabled:opacity-50'

async function readResponse(response: Response) {
  if (!response.headers.get('content-type')?.includes('application/json')) {
    throw new Error(response.status === 413 ? '上传内容过大。' : '服务器暂时未响应，请重试。')
  }
  const data = await response.json()
  if (!response.ok) throw new Error(data.error ?? '请求失败，请重试。')
  return data
}

async function save(payload: object) {
  return readResponse(await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }))
}

function minutesLabel(minutes: number) {
  const hours = Math.floor(minutes / 60)
  if (hours === 0) return <>{minutes}<span className="ml-1 text-sm font-medium">分钟</span></>
  return <>{hours}<span className="mx-1 text-sm font-medium">小时</span>{minutes % 60 > 0 && <>{minutes % 60}<span className="ml-1 text-sm font-medium">分钟</span></>}</>
}

function mondayOf(date: string) {
  const day = new Date(date + 'T00:00:00Z')
  day.setUTCDate(day.getUTCDate() - (day.getUTCDay() + 6) % 7)
  return day.toISOString().slice(0, 10)
}

export default function StudyJournal({ initialRecords, today }: { initialRecords: SavedEntry[] | null; today: string }) {
  const fileInput = useRef<HTMLInputElement>(null)
  const addButton = useRef<HTMLButtonElement>(null)
  const inFlight = useRef(false)
  const [records, setRecords] = useState(initialRecords)
  const [editor, setEditor] = useState<{ entry: SavedEntry | null } | null>(null)
  const [pendingDelete, setPendingDelete] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState('')
  const [error, setError] = useState(initialRecords ? '' : '暂时无法读取学习记录，请重试。')
  const [track, setTrack] = useState('all')
  const [query, setQuery] = useState('')
  const [visible, setVisible] = useState(pageSize)

  const all = records ?? []
  const monday = mondayOf(today)
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

  async function refresh() {
    const { records: saved } = await readResponse(await fetch(endpoint, { cache: 'no-store' }))
    setRecords(saved)
  }

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
      const { records: saved } = await readResponse(await fetch(endpoint, { cache: 'no-store' }))
      const objectUrl = URL.createObjectURL(new Blob([encodeBackup(saved)], { type: 'application/json;charset=utf-8' }))
      const link = document.createElement('a')
      link.href = objectUrl
      link.download = '学习记录-' + today + '.json'
      link.click()
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000)
      setStatus('已生成 ' + saved.length + ' 条学习记录的备份。')
    })
  }

  return <>
    <div className="mt-7 flex flex-wrap gap-2">
      <button ref={addButton} type="button" className={primary} disabled={busy || records === null} aria-expanded={Boolean(editor)}
        onClick={() => { setError(''); setEditor({ entry: null }) }}>
        <Plus className={icon} aria-hidden="true" /> 记一条
      </button>
      <input type="file" accept=".json,application/json" hidden ref={fileInput} onChange={importFile} />
      <button type="button" className={button} disabled={busy || records === null} onClick={() => fileInput.current?.click()}>
        <Upload className={icon} aria-hidden="true" /> 导入备份
      </button>
      <button type="button" className={button} disabled={busy || !all.length} onClick={exportFile}>
        <Download className={icon} aria-hidden="true" /> 导出记录
      </button>
    </div>
    <p className="mt-3 text-sm leading-6 text-gray-600">支持 StudyPilot 手机备份和网页备份。同一条记录只导入一次。</p>
    <p role="status" className={status ? 'mt-3 text-sm font-medium text-gray-800' : 'sr-only'}>{status}</p>
    {error && <div className="mt-4 flex flex-wrap items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-2">
      <p role="alert" className="text-sm text-red-800">{error}</p>
      <button type="button" className={rowButton} disabled={busy} onClick={() => run(refresh)}>重新读取</button>
    </div>}

    {editor && <RecordEditor key={editor.entry?.id ?? 'new'} entry={editor.entry} today={today} busy={busy} onSave={saveEntry} onCancel={closeEditor} />}

    {records !== null && <>
      <dl className="mt-9 grid grid-cols-3 gap-2 border-y border-gray-200 py-5 sm:gap-5">
        <div className="min-w-0">
          <dt className="mb-2 text-sm text-gray-600">本周用时</dt>
          <dd className="text-xl font-bold tabular-nums sm:text-3xl">{minutesLabel(weekMinutes)}</dd>
        </div>
        <div className="min-w-0 border-l border-gray-200 pl-3 sm:pl-5">
          <dt className="mb-2 text-sm text-gray-600">学习天数</dt>
          <dd className="text-xl font-bold tabular-nums sm:text-3xl">{new Set(all.map(record => record.date)).size}<span className="ml-1 text-sm font-medium">天</span></dd>
        </div>
        <div className="min-w-0 border-l border-gray-200 pl-3 sm:pl-5">
          <dt className="mb-2 text-sm text-gray-600">累计记录</dt>
          <dd className="text-xl font-bold tabular-nums sm:text-3xl">{all.length}<span className="ml-1 text-sm font-medium">条</span></dd>
        </div>
      </dl>

      <section aria-labelledby="study-history" className="mt-9">
        <h2 id="study-history" className="text-xl font-bold">历史记录</h2>
        {all.length > 0 && <search aria-label="筛选学习记录" className="mb-5 mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_12rem]">
          <div>
            <label htmlFor="study-query" className="mb-1.5 block text-sm font-medium">搜索</label>
            <input id="study-query" name="query" type="search" placeholder="按学习内容或笔记搜索" className={control} value={query}
              onChange={event => { setQuery(event.target.value); setVisible(pageSize) }} />
          </div>
          <div>
            <label htmlFor="study-track" className="mb-1.5 block text-sm font-medium">学习方向</label>
            <select id="study-track" name="track" className={control} value={track}
              onChange={event => { setTrack(event.target.value); setVisible(pageSize) }}>
              <option value="all">全部方向</option>
              {Object.entries(tracks).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </div>
        </search>}

        {!filtered.length && <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50/70 px-5 py-9">
          <NotebookPen className="mb-3 h-5 w-5 text-gray-500" aria-hidden="true" />
          <p className="font-semibold">{all.length ? '没有符合条件的记录' : '还没有学习记录'}</p>
          <p className="mt-1.5 text-sm leading-6 text-gray-600">{all.length ? '试试其他关键词或学习方向。' : '记录今天学了什么，或者导入手机上已有的记录。'}</p>
        </div>}

        {[...byDate].map(([date, group]) => <section key={date} className="border-t border-gray-200 py-3 sm:grid sm:grid-cols-[8.5rem_minmax(0,1fr)] sm:gap-3">
          <h3 className="pb-1 pt-2 font-mono text-sm font-semibold tabular-nums text-gray-700">
            <time dateTime={date}>{date}</time>{date === today && <span className="ml-2 font-sans text-xs font-medium text-gray-500">今天</span>}
          </h3>
          <ul className="divide-y divide-gray-100">
            {group.map(record => <li key={record.id} className="py-2">
              <div className="flex flex-wrap items-start justify-between gap-x-4">
                <div className="min-w-0 flex-1 pt-1">
                  <h4 className="break-words font-semibold leading-6">{record.title}</h4>
                  <p className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-sm leading-6 text-gray-600">
                    <span>{tracks[record.track]}</span><span className="tabular-nums">{record.minutes} 分钟</span>
                    <span className={record.outcome === 'again' ? 'font-medium text-amber-800' : ''}>{outcomes[record.outcome]}</span>
                    {record.review && <span>复习</span>}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <button type="button" className={rowButton} disabled={busy} aria-label={'编辑 ' + record.title}
                    onClick={() => { setError(''); setEditor({ entry: record }); setPendingDelete(null) }}>编辑</button>
                  <button type="button" className={rowButton} disabled={busy} aria-label={'删除 ' + record.title}
                    aria-expanded={pendingDelete === record.id} onClick={() => setPendingDelete(previous => previous === record.id ? null : record.id)}>删除</button>
                </div>
              </div>
              {record.note && <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-gray-700">{record.note}</p>}
              {pendingDelete === record.id && <div className="mt-2 flex flex-wrap items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-900">
                <p className="mr-auto">删除这条学习记录？</p>
                <button type="button" className={rowButton} disabled={busy} onClick={() => setPendingDelete(null)}>取消</button>
                <button type="button" className={rowButton + ' text-red-800'} disabled={busy} onClick={() => remove(record)}>确认删除</button>
              </div>}
            </li>)}
          </ul>
        </section>)}

        {filtered.length > visible && <button type="button" className={button + ' mt-4'} onClick={() => setVisible(visible + pageSize)}>
          显示更多（剩余 {filtered.length - visible} 条）
        </button>}
      </section>
    </>}
  </>
}
