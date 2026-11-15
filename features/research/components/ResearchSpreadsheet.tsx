'use client'

import { useEffect, useRef, useState } from 'react'
import { CommandType, createUniver, LocaleType, mergeLocales } from '@univerjs/presets'
import { UniverSheetsCorePreset } from '@univerjs/preset-sheets-core'
import zhCN from '@univerjs/preset-sheets-core/locales/zh-CN'
import type { SavedWorkbook } from '../lib/workbook'
import '@univerjs/preset-sheets-core/lib/index.css'

type Editor = ReturnType<typeof createUniver>

export default function ResearchSpreadsheet() {
  const hostRef = useRef<HTMLDivElement>(null)
  const editorRef = useRef<Editor | null>(null)
  const revisionRef = useRef(0)
  const generationRef = useRef(0)
  const dirtyRef = useRef(false)
  const savingRef = useRef(false)
  const aliveRef = useRef(false)
  const [attempt, setAttempt] = useState(0)
  const [ready, setReady] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [savedAt, setSavedAt] = useState('')

  useEffect(() => {
    aliveRef.current = true
    let cancelled = false
    const controller = new AbortController()
    let editor: Editor | null = null
    let listener: { dispose(): void } | undefined
    let lifecycleListener: { dispose(): void } | undefined
    const container = document.createElement('div')
    container.style.height = '100%'
    hostRef.current?.append(container)
    async function load() {
      try {
        const response = await fetch('/api/research/workbook', { cache: 'no-store', signal: controller.signal })
        const data = await response.json()
        if (!response.ok) throw new Error(data.error || '读取表格失败')
        if (cancelled) return
        const saved = data.workbook as SavedWorkbook | null
        revisionRef.current = saved?.revision ?? 0
        setSavedAt(saved?.updated_at ?? '')
        editor = createUniver({
          locale: LocaleType.ZH_CN,
          locales: { [LocaleType.ZH_CN]: mergeLocales(zhCN) },
          presets: [UniverSheetsCorePreset({ container })],
        })
        editor.univerAPI.createWorkbook(saved?.snapshot ?? { name: '研究资料表' })
        editorRef.current = editor
        const api = editor.univerAPI
        const watchEdits = () => {
          lifecycleListener?.dispose()
          listener = api.addEvent(api.Event.CommandExecuted, event => {
            if (event.type !== CommandType.MUTATION || event.options?.onlyLocal) return
            generationRef.current++
            dirtyRef.current = true
            setDirty(true)
          })
          setReady(true)
        }
        if (api.getCurrentLifecycleStage() >= api.Enum.LifecycleStages.Steady) watchEdits()
        else lifecycleListener = api.addEvent(api.Event.LifeCycleChanged, ({ stage }) => {
          if (stage >= api.Enum.LifecycleStages.Steady) watchEdits()
        })
      } catch (cause) {
        if (!cancelled) setError(cause instanceof Error ? cause.message : '表格初始化失败，请重试')
      }
    }
    void load()
    const warn = (event: BeforeUnloadEvent) => {
      if (!dirtyRef.current) return
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', warn)
    return () => {
      cancelled = true
      aliveRef.current = false
      controller.abort()
      editorRef.current = null
      listener?.dispose()
      lifecycleListener?.dispose()
      window.removeEventListener('beforeunload', warn)
      // Univer mounts nested React roots; dispose after the surrounding commit.
      queueMicrotask(() => { editor?.univer.dispose(); container.remove() })
    }
  }, [attempt])

  async function save() {
    const api = editorRef.current?.univerAPI
    if (!api || savingRef.current) return
    savingRef.current = true
    setSaving(true)
    setError('')
    try {
      const workbook = api.getActiveWorkbook()
      if (!workbook) throw new Error('表格尚未准备好')
      await workbook.endEditingAsync(true)
      const generation = generationRef.current
      const body = JSON.stringify({ snapshot: workbook.save(), revision: revisionRef.current })
      if (new Blob([body]).size > 4 * 1024 * 1024) throw new Error('表格超过 4 MB，请精简内容后重试或下载当前副本')
      const response = await fetch('/api/research/workbook', {
        method: 'PUT', cache: 'no-store', headers: { 'Content-Type': 'application/json' }, body,
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || '保存失败，请重试')
      if (!aliveRef.current) return
      revisionRef.current = data.workbook.revision
      setSavedAt(data.workbook.updated_at)
      dirtyRef.current = generationRef.current !== generation
      setDirty(dirtyRef.current)
    } catch (cause) {
      if (aliveRef.current) setError(cause instanceof Error ? cause.message : '保存失败，请重试')
    } finally {
      savingRef.current = false
      if (aliveRef.current) setSaving(false)
    }
  }

  async function downloadCopy() {
    const workbook = editorRef.current?.univerAPI.getActiveWorkbook()
    if (!workbook) return
    await workbook.endEditingAsync(true)
    const url = URL.createObjectURL(new Blob([JSON.stringify(workbook.save())], { type: 'application/json' }))
    const link = document.createElement('a')
    link.href = url
    link.download = '研究资料表.json'
    link.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  return (
    <section className="p-4 md:p-6 min-w-0" aria-labelledby="research-sheet-heading">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div>
          <h1 id="research-sheet-heading" className="text-xl font-bold text-gray-900">研究表格</h1>
          <p className="text-sm text-gray-500 mt-1">整理资料与数据，支持单元格编辑和公式计算。保存后可在下次打开时恢复。</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span role="status" className="text-xs text-gray-500">
            {saving ? '正在保存…' : !ready ? '正在加载…' : dirty ? '有未保存的更改' : savedAt ? `已保存于 ${new Date(savedAt).toLocaleString('zh-CN')}` : '尚未保存'}
          </span>
          <button type="button" disabled={!ready || saving} onClick={() => void downloadCopy()}
            className="min-h-12 px-4 rounded-xl border border-gray-300 bg-white text-sm font-medium disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600">下载副本</button>
          <button type="button" disabled={!ready || saving} onClick={() => void save()}
            className="min-h-12 px-5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">{saving ? '保存中…' : '保存表格'}</button>
        </div>
      </div>
      {error && <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        {error}
        {!ready && <button type="button" className="ml-3 underline min-h-12" onClick={() => { setError(''); setAttempt(value => value + 1) }}>重新加载</button>}
      </div>}
      <div ref={hostRef} aria-label="研究电子表格编辑器" className="h-[70vh] min-h-[480px] overflow-hidden rounded-xl border border-gray-200 bg-white" />
      <p className="mt-3 text-xs text-gray-500">表格仅当前账号可见。请在离开前点击保存；下载副本为 JSON 格式。</p>
    </section>
  )
}
