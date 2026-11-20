'use client'

import { useEffect, useId, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { limits, outcomes, parseEntry, tracks, type Entry, type SavedEntry } from './model'

const focus = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600'
const action = 'inline-flex min-h-12 items-center justify-center gap-2 rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ' + focus
export const control = 'min-h-12 w-full min-w-0 rounded-lg border border-slate-500 bg-white px-3 py-2 text-base text-slate-900 placeholder:text-slate-500 hover:border-slate-600 ' + focus
export const button = action + ' border border-slate-300 bg-white text-slate-700 enabled:hover:border-blue-400 enabled:hover:text-blue-700'
export const primary = action + ' bg-blue-600 text-white enabled:hover:bg-blue-700'

type Props = {
  entry: SavedEntry | null
  draft?: Pick<Entry, 'title' | 'track' | 'date' | 'minutes' | 'review'>
  today: string
  busy: boolean
  onSave: (value: Entry, id?: string) => Promise<void>
  onCancel: () => void
}

export default function RecordEditor({ entry, draft, today, busy, onSave, onCancel }: Props) {
  const id = useId()
  const titleRef = useRef<HTMLInputElement>(null)
  const draftId = useRef<string | undefined>(undefined)
  const [titleError, setTitleError] = useState('')

  const outcomeRef = useRef<HTMLSelectElement>(null)
  useEffect(() => { (draft ? outcomeRef.current : titleRef.current)?.focus() }, [draft])

  function clearTitleError(event: ChangeEvent<HTMLInputElement>) {
    event.currentTarget.setCustomValidity('')
    setTitleError('')
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy) return
    const form = new FormData(event.currentTarget)
    const title = String(form.get('title') ?? '').trim()
    if (!title) {
      const message = '请输入学习内容。'
      setTitleError(message)
      titleRef.current?.setCustomValidity(message)
      titleRef.current?.reportValidity()
      return
    }
    const value = parseEntry({
      title, date: form.get('date'), track: form.get('track'), minutes: Number(form.get('minutes')),
      outcome: form.get('outcome'), note: form.get('note'), review: form.has('review'),
    })
    if (!value) {
      event.currentTarget.querySelector('input:invalid, select:invalid, textarea:invalid')?.scrollIntoView({ block: 'nearest' })
      return
    }
    if (!entry) draftId.current ??= 'web:' + globalThis.crypto.randomUUID()
    await onSave(value, draftId.current)
  }

  return (
    <form onSubmit={submit} method="post" aria-labelledby={id + '-heading'} className="mt-7 rounded-xl border border-slate-200 bg-white p-4 sm:p-6">
      <h2 id={id + '-heading'} className="mb-5 text-xl font-bold tracking-tight">{entry ? '编辑记录' : '新增记录'}</h2>
      <fieldset disabled={busy} className="min-w-0 space-y-4">
        <div>
          <label htmlFor={id + '-title'} className="mb-1.5 block text-sm font-medium">学习内容（必填）</label>
          <input id={id + '-title'} ref={titleRef} name="title" required maxLength={limits.title}
            aria-invalid={Boolean(titleError)} aria-describedby={titleError ? id + '-title-error' : undefined}
            className={control + ' aria-[invalid=true]:border-red-700'} defaultValue={entry?.title ?? draft?.title} onChange={clearTitleError} />
          <p id={id + '-title-error'} role="status" className={titleError ? 'mt-1 text-sm text-red-700' : 'sr-only'}>{titleError}</p>
        </div>
        <div className="grid min-w-0 gap-4 min-[390px]:grid-cols-2 md:grid-cols-4">
          <div className="min-w-0">
            <label htmlFor={id + '-date'} className="mb-1.5 block text-sm font-medium">日期</label>
            <input id={id + '-date'} name="date" type="date" required min="1000-01-01" max="9999-12-31" className={control} defaultValue={entry?.date ?? draft?.date ?? today} />
          </div>
          <div className="min-w-0">
            <label htmlFor={id + '-track'} className="mb-1.5 block text-sm font-medium">方向</label>
            <select id={id + '-track'} name="track" className={control} defaultValue={entry?.track ?? draft?.track ?? 'algorithm'}>
              {Object.entries(tracks).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </div>
          <div className="min-w-0">
            <label htmlFor={id + '-minutes'} className="mb-1.5 block text-sm font-medium">用时（分钟）</label>
            <input id={id + '-minutes'} name="minutes" type="number" inputMode="numeric" min={1} max={limits.minutes}
              required defaultValue={entry?.minutes ?? draft?.minutes ?? 30} className={control} />
          </div>
          <div className="min-w-0">
            <label htmlFor={id + '-outcome'} className="mb-1.5 block text-sm font-medium">学习结果</label>
            <select id={id + '-outcome'} ref={outcomeRef} name="outcome" required className={control} defaultValue={entry?.outcome ?? (draft ? '' : 'independent')}>
              {draft && <option value="" disabled>选择结果</option>}
              {Object.entries(outcomes).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label htmlFor={id + '-note'} className="mb-1.5 block text-sm font-medium">笔记（选填）</label>
          <textarea id={id + '-note'} name="note" rows={3} className={control} maxLength={limits.note} defaultValue={entry?.note} />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <label className="inline-flex min-h-12 cursor-pointer items-center gap-2 text-sm font-medium">
            <input name="review" type="checkbox" className="h-4 w-4 accent-blue-700" defaultChecked={entry?.review ?? draft?.review} /> 这次是复习
          </label>
          <div className="flex flex-wrap gap-2">
            <button type="button" className={button} onClick={onCancel}>取消</button>
            <button type="submit" className={primary}>{busy ? '保存中…' : '保存记录'}</button>
          </div>
        </div>
      </fieldset>
    </form>
  )
}
