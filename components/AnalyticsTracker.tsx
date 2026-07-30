'use client'

// components/AnalyticsTracker.tsx
// 访客追踪组件：在 layout 中引入，每个页面加载和 SPA 路由切换时上报访问数据
// - visitor_id 用 localStorage 持久化（key: mindstack:visitor_id）
// - session_id 30 分钟无活动算新会话（key: mindstack:session_id，存时间戳）
// - 用 navigator.sendBeacon 上报，页面卸载时也能送达，不阻塞页面

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

const VISITOR_ID_KEY = 'mindstack:visitor_id'
const SESSION_ID_KEY = 'mindstack:session_id'
const SESSION_TIMEOUT_MS = 30 * 60 * 1000 // 30 分钟无活动算新会话

// 生成 UUID（优先用 crypto.randomUUID，回退到 Math.random 实现，兼容旧浏览器）
function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

// 获取或创建持久的 visitor_id
function getOrCreateVisitorId(): string {
  try {
    let id = localStorage.getItem(VISITOR_ID_KEY)
    if (!id) {
      id = generateId()
      localStorage.setItem(VISITOR_ID_KEY, id)
    }
    return id
  } catch {
    // localStorage 不可用（隐私模式等），退化为会话级临时 ID
    return generateId()
  }
}

// 获取或创建 session_id（30 分钟过期，每次访问都续期）
function getOrCreateSessionId(): string {
  try {
    const now = Date.now()
    const raw = localStorage.getItem(SESSION_ID_KEY)
    if (raw) {
      const sepIdx = raw.lastIndexOf('|')
      const sid = sepIdx > 0 ? raw.slice(0, sepIdx) : raw
      const ts = sepIdx > 0 ? Number(raw.slice(sepIdx + 1)) : 0
      if (sid && now - ts < SESSION_TIMEOUT_MS) {
        // 续期：刷新时间戳
        localStorage.setItem(SESSION_ID_KEY, `${sid}|${now}`)
        return sid
      }
    }
    const newSid = generateId()
    localStorage.setItem(SESSION_ID_KEY, `${newSid}|${now}`)
    return newSid
  } catch {
    return generateId()
  }
}

// 上报访问数据：优先 sendBeacon（页面卸载也能送达），失败回退到 fetch keepalive
function track(path: string, visitorId: string, sessionId: string) {
  const payload = JSON.stringify({
    path,
    referrer: typeof document !== 'undefined' ? document.referrer || '' : '',
    visitorId,
    sessionId,
  })
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
      const blob = new Blob([payload], { type: 'application/json' })
      // sendBeacon 成功返回 true；sendBeacon 不读取响应体，刚好匹配 204 场景
      if (navigator.sendBeacon('/api/analytics/track', blob)) return
    }
  } catch {
    // 回退到 fetch
  }
  try {
    void fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
      keepalive: true,
    }).catch(() => { /* 静默失败 */ })
  } catch {
    // 静默失败
  }
}

export default function AnalyticsTracker() {
  const pathname = usePathname()

  useEffect(() => {
    if (!pathname) return
    // 忽略 API 路由（不应作为页面被追踪）
    if (pathname.startsWith('/api/')) return
    // 忽略 admin 后台路由（避免污染统计数据）
    if (pathname.startsWith('/admin')) return
    const visitorId = getOrCreateVisitorId()
    const sessionId = getOrCreateSessionId()
    track(pathname, visitorId, sessionId)
  }, [pathname])

  return null
}
