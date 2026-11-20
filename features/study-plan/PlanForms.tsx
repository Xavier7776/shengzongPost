'use client'

import { useRef, type FormEvent } from 'react'
import { button, control, primary } from '@/features/study-records/RecordEditor'
import { maxBackupBytes } from '@/features/study-records/model'
import { focusLabels, importMobilePlan, modeLabels, parseDay, parseStudyPlan, type DayOverride, type StudyPlan } from './model'

const label = 'grid min-w-0 gap-1.5 text-sm font-medium text-slate-700'

export function DayEditor({ value, disabled, onSave, onCancel, onReset }: {
  value: DayOverride; disabled: boolean; onSave: (day: DayOverride | null) => void; onCancel: () => void; onReset: () => void
}) {
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const fields = new FormData(event.currentTarget)
    const minutes = fields.get('minutes')
    const title = String(fields.get('extra-title') ?? '').trim()
    onSave(parseDay({
      minutes: minutes === '' ? null : Number(minutes), mode: fields.get('mode'), focus: fields.get('focus'),
      extra: title ? { title, minutes: Number(fields.get('extra-minutes')) } : null,
    }))
  }

  return <form aria-label="调整当日计划" onSubmit={submit} method="post" className="border-b border-slate-200 px-4 py-5 sm:px-6">
    <fieldset disabled={disabled} className="min-w-0">
      <div className="grid gap-3 sm:grid-cols-3">
        <label className={label}>可用时间（分钟）<input name="minutes" type="number" min={0} max={1440} placeholder="使用日常预算" className={control} defaultValue={value.minutes ?? ''} /></label>
        <label className={label}>学习模式<select name="mode" className={control} defaultValue={value.mode}>
          {Object.entries(modeLabels).map(([key, text]) => <option key={key} value={key}>{text}</option>)}
        </select></label>
        <label className={label}>优先方向<select name="focus" className={control} defaultValue={value.focus}>
          {Object.entries(focusLabels).map(([key, text]) => <option key={key} value={key}>{text}</option>)}
        </select></label>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-[minmax(0,1fr)_10rem]">
        <label className={label}>自定义任务（选填）<input name="extra-title" maxLength={120} placeholder="例如阅读 STM32 GPIO 手册" defaultValue={value.extra?.title} className={control} /></label>
        <label className={label}>任务时长（分钟）<input name="extra-minutes" type="number" min={1} max={1440} defaultValue={value.extra?.minutes ?? 20} className={control} /></label>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button type="submit" className={primary}>保存这一天</button>
        <button type="button" onClick={onCancel} className={button}>取消</button>
        <button type="button" onClick={onReset} className={button}>恢复日常安排</button>
      </div>
    </fieldset>
  </form>
}

export function PlanSettings({ value, disabled, onSave }: {
  value: StudyPlan; disabled: boolean; onSave: (plan: StudyPlan | null, imported?: boolean) => void
}) {
  const input = useRef<HTMLInputElement>(null)

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const fields = new FormData(event.currentTarget)
    onSave(parseStudyPlan({
      ...value, startDate: fields.get('startDate'), weekdayMinutes: Number(fields.get('weekdayMinutes')),
      weekendMinutes: Number(fields.get('weekendMinutes')),
    }))
  }

  return <form aria-label="路线与时间设置" onSubmit={submit} method="post" className="mt-4">
    <fieldset disabled={disabled} className="min-w-0">
      <div className="grid gap-3 sm:grid-cols-3">
        <label className={label}>路线开始日期<input name="startDate" type="date" required min="1900-01-01" max="2100-12-31" defaultValue={value.startDate} className={control} /></label>
        <label className={label}>工作日（分钟）<input name="weekdayMinutes" type="number" required min={1} max={1440} defaultValue={value.weekdayMinutes} className={control} /></label>
        <label className={label}>周末（分钟）<input name="weekendMinutes" type="number" required min={1} max={1440} defaultValue={value.weekendMinutes} className={control} /></label>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button type="submit" className={primary}>保存日常预算</button>
        <button type="button" onClick={() => input.current?.click()} className={button} aria-describedby="study-import-source">导入手机计划设置</button>
        <input ref={input} type="file" hidden accept=".json,application/json" onChange={async event => {
          const file = event.currentTarget.files?.[0]
          event.currentTarget.value = ''
          if (!file) return
          if (file.size > maxBackupBytes) {
            onSave(null, true)
            return
          }
          try { onSave(importMobilePlan(await file.text(), value), true) } catch { onSave(null, true) }
        }} />
      </div>
      <p id="study-import-source" className="mt-2 text-sm leading-6 text-slate-600">从 StudyPilot 备份读取开始日期、工作日和周末预算，以及每天的忙碌或休息设置。</p>
    </fieldset>
  </form>
}
