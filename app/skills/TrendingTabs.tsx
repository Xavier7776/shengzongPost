'use client'
// app/skills/TrendingTabs.tsx
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Flame, Calendar, TrendingUp, Microscope } from 'lucide-react'

const TABS = [
  { key: 'daily', label: '每日热门', icon: Flame },
  { key: 'weekly', label: '每周热门', icon: Calendar },
  { key: 'growth', label: 'Star 增速', icon: TrendingUp },
] as const

export default function TrendingTabs() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const currentTab = (searchParams.get('trending_tab') || 'daily') as string

  const setTab = (tab: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('trending_tab', tab)
    router.push(`/skills?${params.toString()}`)
  }

  return (
    <div className="flex items-center gap-2 mb-8 flex-wrap">
      {TABS.map(tab => {
        const Icon = tab.icon
        const isActive = currentTab === tab.key
        return (
          <button
            key={tab.key}
            onClick={() => setTab(tab.key)}
            className={`flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-full transition-all duration-200 ${
              isActive
                ? 'bg-gray-900 text-white shadow-sm'
                : 'bg-gray-50 text-gray-400 border border-gray-100 hover:border-gray-300 hover:text-gray-600'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        )
      })}
      {/* 深度研究 — 独立页面入口，用分隔线区分 */}
      <div className="w-px h-5 bg-gray-200 mx-1" />
      <Link
        href="/skills/research"
        className="flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-full transition-all duration-200 bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-sm hover:shadow-md hover:scale-105"
      >
        <Microscope className="w-3.5 h-3.5" />
        深度研究
        <span className="text-[8px] font-bold px-1.5 py-0.5 bg-white/20 rounded-full text-white border border-white/30">BETA</span>
      </Link>
    </div>
  )
}
