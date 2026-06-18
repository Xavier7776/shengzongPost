'use client'
// app/skills/SkillTrendingSwitch.tsx
import { useRouter, useSearchParams } from 'next/navigation'
import { Wrench, BarChart3 } from 'lucide-react'

interface SkillTrendingSwitchProps {
  view: string
  trendingTab: string
}

export default function SkillTrendingSwitch({ view, trendingTab }: SkillTrendingSwitchProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const setView = (v: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('view', v)
    params.delete('page')
    router.push(`/skills?${params.toString()}`)
  }

  return (
    <div className="flex items-center gap-2 mb-10">
      <button
        onClick={() => setView('skills')}
        className={`flex items-center gap-2 text-sm font-bold px-5 py-2.5 rounded-full transition-all duration-200 ${
          view === 'skills'
            ? 'bg-blue-600 text-white shadow-sm'
            : 'bg-gray-50 text-gray-400 border border-gray-100 hover:border-blue-300 hover:text-blue-600'
        }`}
      >
        <Wrench className="w-4 h-4" />
        AI Skills
      </button>
      <button
        onClick={() => setView('trending')}
        className={`flex items-center gap-2 text-sm font-bold px-5 py-2.5 rounded-full transition-all duration-200 ${
          view === 'trending'
            ? 'bg-blue-600 text-white shadow-sm'
            : 'bg-gray-50 text-gray-400 border border-gray-100 hover:border-blue-300 hover:text-blue-600'
        }`}
      >
        <BarChart3 className="w-4 h-4" />
        GitHub Trending
      </button>
    </div>
  )
}
