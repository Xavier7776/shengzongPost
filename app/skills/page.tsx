// app/skills/page.tsx
import { getSkills, getSkillCategories } from '@/lib/db-skills'
import type { Metadata } from 'next'
import SkillList from './SkillList'

export const revalidate = 3600 // 1小时缓存

export const metadata: Metadata = {
  title: 'AI Skills — MindStack.',
  description: '探索最新的 AI Agent Skills，来自 GitHub 等平台的精选工具与资源',
}

const PAGE_SIZE = 12

export default async function SkillsPage({ searchParams }: { searchParams: { page?: string } }) {
  const page = Math.max(1, parseInt(searchParams.page ?? '1', 10) || 1)
  const [{ skills, total }, categories] = await Promise.all([
    getSkills({ page, pageSize: PAGE_SIZE, sort: 'stars', order: 'desc' }),
    getSkillCategories(),
  ])
  return <SkillList skills={skills} total={total} page={page} pageSize={PAGE_SIZE} categories={categories} />
}
