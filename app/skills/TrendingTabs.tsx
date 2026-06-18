'use client'
// app/skills/TrendingTabs.tsx
import { useSearchParams, useRouter } from 'next/navigation'
import { Flame, Calendar, TrendingUp } from 'lucide-react'

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
    <div className="flex items-center gap-2 mb-8">
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
    </div>
  )
}
