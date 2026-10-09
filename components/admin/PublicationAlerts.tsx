'use client'
import { useEffect, useState } from 'react'
export default function PublicationAlerts({alerts}:{alerts:{key:string;text:string}[]}) {
  const [visible,setVisible]=useState<typeof alerts>([])
  useEffect(()=>{
    const now=Date.now()
    // shortcut: browser-only cooldown; cross-device delivery needs the approved persistent audit.
    let seen:Record<string,number>={}
    try {
      const parsed=JSON.parse(localStorage.getItem('learn-alert-cooldown')||'{}')
      if(parsed && typeof parsed==='object' && !Array.isArray(parsed)) {
        seen=Object.fromEntries(Object.entries(parsed).filter(([,at])=>typeof at==='number' && Number.isFinite(at) && at<=now && now-at<2*86400000)) as Record<string,number>
      }
    } catch { /* Storage unavailable: still show actionable observations on this visit. */ }
    const next=alerts.filter(alert=>!seen[alert.key]||now-seen[alert.key]>=86400000)
    setVisible(next)
    for(const alert of next)seen[alert.key]=now
    try {localStorage.setItem('learn-alert-cooldown',JSON.stringify(seen))} catch { /* No durable delivery claim. */ }
  },[alerts])
  if(!visible.length)return null
  return <aside role="alert" className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-7 text-amber-900">
    <strong>出版巡检提醒</strong>
    <ul className="list-disc pl-5">{visible.map(alert=><li key={alert.key}>{alert.text}</li>)}</ul>
    <p className="mt-2 text-xs">同一浏览器内同类提醒冷却 24 小时；完整状态仍见日历。任务运行状态未知，不发送邮件。</p>
  </aside>
}
