// app/blog/page.tsx
import { getPostsPaginated, getPostsPaginatedByTag, getBlogTagCounts, getPopularPosts } from '@/lib/db'
import type { Metadata } from 'next'
import BlogList from './BlogList'

// ISR：列表页缓存 60 秒，二次访问秒开；新文章最多延迟 60 秒可见
export const revalidate = 60

export const metadata: Metadata = {
  title: '技术随笔 — MindStack.',
  description: '关于前端架构、设计系统与工程实践的思考',
}

const PAGE_SIZE = 12

// 流式加载：数据获取包在 Suspense 中，骨架屏先行渲染，数据就绪后流式注入
export default async function BlogPage({ searchParams }: { searchParams: Promise<{ page?: string; tag?: string }> }) {
  const { page: pageParam, tag: tagParam } = await searchParams
  const page = Math.max(1, parseInt(pageParam ?? '1', 10) || 1)
  // 直接 await：配合 revalidate=60，命中缓存时无数据库往返，响应极快
  // Tag filters are executed in Neon across all published posts, not only current page.
  const tag = tagParam?.trim() && tagParam.length <= 100 ? tagParam.trim() : null
  const [result, tagCounts, popularPosts] = await Promise.all([
    tag ? getPostsPaginatedByTag(page, PAGE_SIZE, tag) : getPostsPaginated(page, PAGE_SIZE),
    getBlogTagCounts(),
    getPopularPosts(8),
  ])
  return <BlogList
    posts={result.posts} total={result.total} page={page} pageSize={PAGE_SIZE}
    globalTags={tagCounts} popularPostsData={popularPosts} selectedTag={tag}
  />
}
