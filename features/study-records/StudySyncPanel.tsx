'use client'

import { useEffect, useId, useState } from 'react'
import { Smartphone } from 'lucide-react'
import { button, primary } from './RecordEditor'

type Device = { name: string; lastSyncAt: string | null }
const endpoint = '/api/admin/study-sync'
const dateFormat = new Intl.DateTimeFormat('zh-CN', {
  timeZone: 'Asia/Shanghai', dateStyle: 'short', timeStyle: 'short',
})

export default function StudySyncPanel({ onSync }: { onSync: () => Promise<void> }) {
  const id = useId()
  const [open, setOpen] = useState(false)
  const [device, setDevice] = useState<Device | null | undefined>()
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')
  const [confirm, setConfirm] = useState(false)

  useEffect(() => {
    if (!open) return
    const controller = new AbortController()
    let lastSync: string | null | undefined
    let timer: ReturnType<typeof setTimeout>
    async function poll() {
      try {
        const result = await fetch(endpoint, { cache: 'no-store', signal: controller.signal })
        if (!result.ok) throw new Error()
        const data: { device: Device | null } = await result.json()
        if (controller.signal.aborted) return
        setDevice(data.device)
        const syncedAt = data.device?.lastSyncAt
        if (syncedAt && syncedAt !== lastSync) await onSync()
        lastSync = syncedAt
      } catch {
        if (!controller.signal.aborted) setNotice('暂时无法读取同步状态。')
      } finally {
        if (!controller.signal.aborted) timer = setTimeout(poll, 8000)
      }
    }
    void poll()
    return () => { controller.abort(); clearTimeout(timer) }
  }, [onSync, open])

  async function operate(action: 'pair' | 'revoke') {
    setBusy(true)
    setNotice('')
    try {
      const response = await fetch(endpoint, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action }),
      })
      if (!response.ok) throw new Error()
      const data = await response.json()
      setCode(action === 'pair' ? data.code : '')
      if (action === 'revoke') {
        setDevice(null)
        setConfirm(false)
        setNotice('已撤销手机同步。')
      }
    } catch {
      setNotice('操作失败，请检查管理员登录状态后重试。')
    } finally {
      setBusy(false)
    }
  }

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(code)
      setNotice('已复制配对码。')
    } catch {
      setNotice('请手动选中并复制配对码。')
    }
  }

  return (
    <section className="mt-4">
      <button type="button" aria-expanded={open} aria-controls={id} className={button}
        onClick={() => { setOpen(!open); setCode(''); setNotice(''); setConfirm(false) }}>
        <Smartphone className="size-4" aria-hidden="true" /> 手机同步
      </button>
      <div id={id} hidden={!open} className="mt-3 rounded-xl border border-[#e5e9f0] bg-white p-4 sm:p-5">
        <h2 className="text-base font-bold">StudyPilot 手机同步</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">在手机 StudyPilot 的「设置 → 博客同步」输入配对码。配对后，手机里的学习记录会自动上传。</p>
        <p className="mt-2 text-sm font-medium text-slate-700">
          {device === undefined ? '正在读取设备状态…' : device
            ? '已连接 ' + device.name + (device.lastSyncAt ? ' · 最近同步 ' + dateFormat.format(new Date(device.lastSyncAt)) : '')
            : '尚未连接手机'}
        </p>
        {code && <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1">
          <code className="select-all rounded-md bg-slate-100 p-2 font-mono text-sm [overflow-wrap:anywhere]">{code}</code>
          <button type="button" className={button} onClick={copyCode}>复制配对码</button>
          <p className="basis-full text-xs leading-5 text-slate-600">10 分钟内有效，仅可使用一次。新手机配对成功后会替换当前设备。</p>
        </div>}
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" className={primary} disabled={busy} onClick={() => operate('pair')}>生成配对码</button>
          {(device || code) && !confirm && <button type="button" className={button} disabled={busy} onClick={() => setConfirm(true)}>撤销配对</button>}
          {confirm && <>
            <button type="button" className={button} disabled={busy} onClick={() => setConfirm(false)}>取消</button>
            <button type="button" className={button} disabled={busy} onClick={() => operate('revoke')}>确认撤销</button>
          </>}
        </div>
        <p role="status" className={notice ? 'mt-2 text-sm text-slate-700' : 'sr-only'}>{notice}</p>
      </div>
    </section>
  )
}
