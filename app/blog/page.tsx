// app/blog/page.tsx
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import SectionHeading from '@/components/ui/SectionHeading'
import { getAllPosts } from '@/lib/db'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata: Metadata = {
  title: '技术随笔 — ARC.',
  description: '关于前端架构、设计系统与工程实践的思考',
}

export default async function BlogPage() {
  const posts = await getAllPosts()

  return (
    <div className="max-w-[800px] mx-auto px-6 py-24 animate-in">
      <SectionHeading>技术随笔</SectionHeading>
      {posts.length === 0 && (
        <p className="text-gray-400 text-lg mt-16">还没有文章，快去后台写一篇吧。</p>
      )}
      <div className="space-y-16">
        {posts.map((post, i) => (
          <Link key={post.slug} href={`/blog/${post.slug}`} className="group block">
            <time className="text-sm text-blue-600 font-mono mb-4 block">{post.created_at.slice(0, 10)}</time>
            <h3 className="text-3xl font-black text-gray-900 mb-4 group-hover:text-blue-600 transition-colors tracking-tighter leading-tight">
              {post.title}
            </h3>
            <p className="text-gray-500 text-lg leading-relaxed mb-6 line-clamp-2">{post.excerpt}</p>
            <span className="text-blue-600 text-xs font-black uppercase tracking-widest flex items-center group-hover:gap-2 transition-all">
              阅读全文
              <ChevronRight className="w-4 h-4 ml-1" />
            </span>
            {i < posts.length - 1 && <div className="h-px bg-gray-100 w-full mt-16" />}
          </Link>
        ))}
      </div>
    </div>
  )
}
