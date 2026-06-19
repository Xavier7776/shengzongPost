// app/skills/page.tsx
import type { Metadata } from 'next'
import TrendingTabs from './TrendingTabs'
import TrendingList from './TrendingList'

export const revalidate = 3600 // 1小时缓存

export const metadata: Metadata = {
  title: 'GitHub Trending — MindStack.',
  description: '探索最新的 GitHub Trending 项目',
}

export default async function SkillsPage({
  searchParams,
}: {
  searchParams: { trending_tab?: string }
}) {
  const trendingTab = (searchParams.trending_tab || 'daily') as 'daily' | 'weekly' | 'growth'

  return (
    <div className="max-w-6xl mx-auto px-6 py-24 animate-in">
      <div className="mb-8">
        <TrendingTabs />
      </div>
      <TrendingList period={trendingTab} />
    </div>
  )
}
