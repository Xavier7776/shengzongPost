// app/blog/page.tsx
import { getPostsPaginated } from '@/lib/db'
import type { Metadata } from 'next'
import BlogList from './BlogList'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata: Metadata = {
  title: '技术随笔 — MindStack.',
  description: '关于前端架构、设计系统与工程实践的思考',
}

const PAGE_SIZE = 12

export default async function BlogPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const { page: pageParam } = await searchParams
  const page = Math.max(1, parseInt(pageParam ?? '1', 10) || 1)
  const { posts, total } = await getPostsPaginated(page, PAGE_SIZE)
  return <BlogList posts={posts} total={total} page={page} pageSize={PAGE_SIZE} />
}
