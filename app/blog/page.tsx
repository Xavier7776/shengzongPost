// app/blog/page.tsx
import { getAllPosts } from '@/lib/db'
import type { Metadata } from 'next'
import BlogList from './BlogList'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata: Metadata = {
  title: '技术随笔 — MindStack.',
  description: '关于前端架构、设计系统与工程实践的思考',
}

export default async function BlogPage() {
  const posts = await getAllPosts()
  return <BlogList posts={posts} />
}
