'use client'
// app/skills/TrendingList.tsx
// 深色仪表盘风格：顶部数据概览 + Top3 领奖台 + 4-30 紧凑列表
import { useState, useEffect, useMemo } from 'react'
import TrendingCard from '@/components/sections/TrendingCard'
import TrendingStats from '@/components/sections/TrendingStats'
import { Loader2, BarChart3 } from 'lucide-react'

interface TrendingItem {
  id: number
  repo_name: string
  slug: string
  full_name: string
  description: string | null
  html_url: string
  stars: number
  forks: number
  language: string | null
  owner_avatar: string | null
  topics: string[]
  period: string
  stars_gained: number
  rank: number
  crawled_at: string
}

interface TrendingListProps {
  period: 'daily' | 'weekly' | 'growth'
}

const PERIOD_LABELS: Record<string, string> = {
  daily: '每日热门',
  weekly: '每周热门',
  growth: 'Star 增速',
}

export default function TrendingList({ period }: TrendingListProps) {
  const [items, setItems] = useState<TrendingItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [crawledAt, setCrawledAt] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)

    fetch(`/api/trending?period=${period}&limit=30`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch')
        return res.json()
      })
      .then(data => {
        setItems(data.trending || [])
        setCrawledAt(data.crawledAt)
        setLoading(false)
      })
      .catch(err => {
        console.error('Trending fetch error:', err)
        setError('加载失败，请稍后重试')
        setLoading(false)
      })
  }, [period])

  // 计算 maxStars 用于进度条比例
  const maxStars = useMemo(() => {
    if (items.length === 0) return 0
    return Math.max(...items.map(i => i.stars))
  }, [items])

  // 拆分 Top3 和其余
  const top3 = useMemo(() => items.filter(i => i.rank <= 3), [items])
  const rest = useMemo(() => items.filter(i => i.rank > 3), [items])

  if (loading) {
    return (
      <div className="flex flex-col items-center py-20 gap-3 text-gray-400">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <p className="text-sm">正在加载 Trending 数据…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center py-20 gap-3 text-gray-400">
        <BarChart3 className="w-10 h-10 opacity-30" />
        <p className="text-sm">{error}</p>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center py-20 gap-3 text-gray-400">
        <BarChart3 className="w-10 h-10 opacity-30" />
        <p className="text-sm">暂无数据，等待下次爬取…</p>
        <p className="text-xs text-gray-300">每 3 天自动更新一次</p>
      </div>
    )
  }

  return (
    <div>
      {/* 更新时间 */}
      {crawledAt && (
        <div className="flex items-center justify-between mb-6">
          <p className="text-xs text-gray-400 font-mono">
            <span className="text-gray-300">更新于</span>{' '}
            {new Date(crawledAt).toLocaleDateString('zh-CN')}{' '}
            {new Date(crawledAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
            <span className="text-gray-200 mx-2">·</span>
            <span className="text-gray-500">共 {items.length} 个项目</span>
          </p>
          <span className="text-[10px] font-bold tracking-widest uppercase text-blue-600 bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-md">
            {PERIOD_LABELS[period]}
          </span>
        </div>
      )}

      {/* 数据概览面板 */}
      <TrendingStats items={items} period={period} />

      {/* Top 3 领奖台 */}
      {top3.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-4 bg-amber-400 rounded-full" />
            <h2 className="text-xs font-black tracking-widest uppercase text-gray-500">
              Top 3 领奖台
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {top3.map((item, i) => (
              <TrendingCard key={item.repo_name} item={item} index={i} maxStars={maxStars} />
            ))}
          </div>
        </div>
      )}

      {/* 4-30 名列表 */}
      {rest.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-4 bg-blue-500 rounded-full" />
            <h2 className="text-xs font-black tracking-widest uppercase text-gray-500">
              排行榜 · #{rest[0].rank} - #{rest[rest.length - 1].rank}
            </h2>
          </div>
          <div className="space-y-2">
            {rest.map((item, i) => (
              <TrendingCard
                key={item.repo_name}
                item={item}
                index={i + top3.length}
                maxStars={maxStars}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
