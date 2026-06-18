// app/skills/page.tsx
import { getSkills, getSkillCategories } from '@/lib/db-skills'
import type { Metadata } from 'next'
import SkillList from './SkillList'
import SkillTrendingSwitch from './SkillTrendingSwitch'
import TrendingTabs from './TrendingTabs'
import TrendingList from './TrendingList'

export const revalidate = 3600 // 1小时缓存

export const metadata: Metadata = {
  title: 'AI Skills — MindStack.',
  description: '探索最新的 AI Agent Skills 和 GitHub Trending 项目',
}

const PAGE_SIZE = 12

export default async function SkillsPage({
  searchParams,
}: {
  searchParams: { page?: string; view?: string; trending_tab?: string }
}) {
  const view = searchParams.view || 'skills'
  const trendingTab = (searchParams.trending_tab || 'daily') as 'daily' | 'weekly' | 'growth'

  return (
    <div className="max-w-[960px] mx-auto px-6 py-24 animate-in">
      <SkillTrendingSwitch view={view} trendingTab={trendingTab} />

      {view === 'trending' ? (
        <div>
          <div className="mb-8">
            <TrendingTabs />
          </div>
          <TrendingList period={trendingTab} />
        </div>
      ) : (
        <SkillsContent searchParams={searchParams} />
      )}
    </div>
  )
}

async function SkillsContent({ searchParams }: { searchParams: { page?: string } }) {
  const page = Math.max(1, parseInt(searchParams.page ?? '1', 10) || 1)
  const [{ skills, total }, categories] = await Promise.all([
    getSkills({ page, pageSize: PAGE_SIZE, sort: 'stars', order: 'desc' }),
    getSkillCategories(),
  ])
  return <SkillList skills={skills} total={total} page={page} pageSize={PAGE_SIZE} categories={categories} />
}
