// app/skills/page.tsx
import type { Metadata } from 'next'
import { Suspense } from 'react'
import TrendingTabs from './TrendingTabs'
import TrendingList from './TrendingList'
import SkillTrendingSwitch from './SkillTrendingSwitch'
import SkillList from './SkillList'
import { getSkills, getSkillCategories } from '@/lib/db-skills'

// Skills 页面：Trending 视图客户端 fetch（已有模块级缓存），Skills 视图服务端查询
// 用 ISR 60 秒缓存加速二次访问
export const revalidate = 60

export const metadata: Metadata = {
  title: 'Skills & Trending — MindStack.',
  description: '探索最新的 AI Agent Skills 和 GitHub Trending 项目',
}

export default async function SkillsPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; trending_tab?: string; page?: string }>
}) {
  const { view: viewRaw, trending_tab, page: pageRaw } = await searchParams
  const view = viewRaw === 'skills' ? 'skills' : 'trending'
  const trendingTab = (trending_tab || 'daily') as 'daily' | 'weekly' | 'growth'
  const page = Math.max(1, parseInt(pageRaw || '1', 10))

  // Skills 视图需要服务端查询数据
  let skillsData: {
    skills: Awaited<ReturnType<typeof getSkills>>['skills']
    total: number
    categories: Awaited<ReturnType<typeof getSkillCategories>>
  } | null = null
  if (view === 'skills') {
    const [result, categories] = await Promise.all([
      getSkills({ page, pageSize: 12, sort: 'updated_at', order: 'desc' }),
      getSkillCategories(),
    ])
    skillsData = { skills: result.skills, total: result.total, categories }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-16 md:py-24 animate-in">
      {/* Skills / Trending 视图切换 */}
      <Suspense fallback={null}>
        <SkillTrendingSwitch view={view} trendingTab={trendingTab} />
      </Suspense>

      {view === 'trending' ? (
        <>
          <div className="mb-8">
            <Suspense fallback={null}>
              <TrendingTabs />
            </Suspense>
          </div>
          <TrendingList period={trendingTab} />
        </>
      ) : skillsData ? (
        <SkillList
          skills={skillsData.skills}
          total={skillsData.total}
          page={page}
          pageSize={12}
          categories={skillsData.categories}
        />
      ) : null}
    </div>
  )
}
