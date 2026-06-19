'use client'
// app/skills/TrendingList.tsx
// 深色仪表盘风格：顶部数据概览 + Top3 领奖台 + 4-30 紧凑列表
import { useState, useEffect, useMemo, useRef } from 'react'
import TrendingCard from '@/components/sections/TrendingCard'
import TrendingStats from '@/components/sections/TrendingStats'
import { Loader2, BarChart3, RefreshCw } from 'lucide-react'

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

// 模块级缓存：跨组件实例共享，切换 period 不丢失已加载数据
// staleTime 内视为新鲜，不触发后台刷新；maxAge 内可立即显示
const STALE_TIME = 5 * 60 * 1000  // 5 分钟
const MAX_AGE = 60 * 60 * 1000     // 1 小时内可立即显示旧数据
const cache = new Map<string, { items: TrendingItem[]; crawledAt: string | null; ts: number }>()

export default function TrendingList({ period }: TrendingListProps) {
  // lazy initializer：首次渲染直接命中缓存，避免 loading 闪烁
  const [items, setItems] = useState<TrendingItem[]>(() => cache.get(period)?.items ?? [])
  const [loading, setLoading] = useState(() => !cache.has(period))
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [crawledAt, setCrawledAt] = useState<string | null>(() => cache.get(period)?.crawledAt ?? null)
  // 防止 StrictMode 双调用 + 竞态
  const inflight = useRef<AbortController | null>(null)

  useEffect(() => {
    const cached = cache.get(period)
    const now = Date.now()

    // 命中缓存：立即展示，避免 loading 闪烁
    if (cached) {
      setItems(cached.items)
      setCrawledAt(cached.crawledAt)
      setError(null)

      // 仍在新鲜期内：无需任何网络请求
      if (now - cached.ts < STALE_TIME) {
        setLoading(false)
        setRefreshing(false)
        return
      }
      // 已过期但未超 maxAge：立即显示旧数据 + 后台静默刷新
      setLoading(false)
      setRefreshing(true)
    } else {
      // 无缓存：显示 loading
      setLoading(true)
      setRefreshing(false)
    }

    // 取消上一次未完成的请求（竞态保护）
    if (inflight.current) inflight.current.abort()
    const controller = new AbortController()
    inflight.current = controller

    fetch(`/api/trending?period=${period}&limit=30`, { signal: controller.signal })
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch')
        return res.json()
      })
      .then(data => {
        const nextItems = data.trending || []
        const nextCrawledAt = data.crawledAt
        setItems(nextItems)
        setCrawledAt(nextCrawledAt)
        cache.set(period, { items: nextItems, crawledAt: nextCrawledAt, ts: Date.now() })
        setLoading(false)
        setRefreshing(false)
        setError(null)
      })
      .catch(err => {
        if (err.name === 'AbortError') return  // 被新请求取代，忽略
        console.error('Trending fetch error:', err)
        // 已有缓存时不清空数据，只提示刷新失败
        if (cache.has(period)) {
          setRefreshing(false)
        } else {
          setError('加载失败，请稍后重试')
          setLoading(false)
        }
      })

    return () => controller.abort()
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
          <p className="text-xs text-gray-400 font-mono flex items-center gap-2">
            <span className="text-gray-300">更新于</span>{' '}
            {new Date(crawledAt).toLocaleDateString('zh-CN')}{' '}
            {new Date(crawledAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
            <span className="text-gray-200 mx-1">·</span>
            <span className="text-gray-500">共 {items.length} 个项目</span>
            {refreshing && (
              <span className="inline-flex items-center gap-1 text-blue-500 ml-1">
                <RefreshCw className="w-3 h-3 animate-spin" />
                <span className="text-[10px]">同步中</span>
              </span>
            )}
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
