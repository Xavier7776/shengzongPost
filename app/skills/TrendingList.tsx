'use client'
// app/skills/TrendingList.tsx
import { useState, useEffect } from 'react'
import TrendingCard from '@/components/sections/TrendingCard'
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

  if (loading) {
    return (
      <div className="flex flex-col items-center py-20 gap-3 text-gray-400">
        <Loader2 className="w-8 h-8 animate-spin" />
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
      {crawledAt && (
        <p className="text-xs text-gray-400 font-mono mb-6">
          更新于 {new Date(crawledAt).toLocaleDateString('zh-CN')} · 共 {items.length} 个项目
        </p>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {items.map((item, i) => (
          <TrendingCard key={item.repo_name} item={item} index={i} />
        ))}
      </div>
    </div>
  )
}
