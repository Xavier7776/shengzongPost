// app/skills/page.tsx
import type { Metadata } from 'next'
import { Suspense } from 'react'
import TrendingTabs from './TrendingTabs'
import TrendingList from './TrendingList'

export const dynamic = 'force-dynamic' // searchParams + 数据库查询需要动态渲染

export const metadata: Metadata = {
  title: 'GitHub Trending — MindStack.',
  description: '探索最新的 GitHub Trending 项目',
}

export default async function SkillsPage({
  searchParams,
}: {
  searchParams: Promise<{ trending_tab?: string }>
}) {
  const { trending_tab } = await searchParams
  const trendingTab = (trending_tab || 'daily') as 'daily' | 'weekly' | 'growth'

  return (
    <div className="max-w-6xl mx-auto px-6 py-24 animate-in">
      <div className="mb-8">
        <Suspense fallback={null}>
          <TrendingTabs />
        </Suspense>
      </div>
      <TrendingList period={trendingTab} />
    </div>
  )
}
