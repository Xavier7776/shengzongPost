'use client'

// components/sections/ViewTracker.tsx
// 页面加载后静默上报访问次数，用 sessionStorage 防止同一 session 内重复计数

import { useEffect } from 'react'
import { usePointsToast } from '@/components/ui/PointsToast'

export default function ViewTracker({ slug }: { slug: string }) {
  const { showPointsToast } = usePointsToast()

  useEffect(() => {
    const key = `viewed:${slug}`
    if (sessionStorage.getItem(key)) return
    sessionStorage.setItem(key, '1')
    fetch('/api/posts/view', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug }),
    })
      .then(r => r.json())
      .then(d => { if (d.pointsAdded) showPointsToast(2, '阅读完成 +2 积分') })
      .catch(() => {/* 静默失败 */})
  }, [slug, showPointsToast])

  return null
}
