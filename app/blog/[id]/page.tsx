import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { BLOG_POSTS } from '@/lib/data'
import type { Metadata } from 'next'

interface PageProps {
  params: { id: string }
}

export function generateStaticParams() {
  return BLOG_POSTS.map(p => ({ id: String(p.id) }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const post = BLOG_POSTS.find(p => p.id === Number(params.id))
  if (!post) return { title: '文章不存在 — ARC.' }
  return {
    title: `${post.title} — ARC.`,
    description: post.excerpt,
  }
}

export default function BlogPostPage({ params }: PageProps) {
  const post = BLOG_POSTS.find(p => p.id === Number(params.id))
  if (!post) notFound()

  return (
    <div className="max-w-[800px] mx-auto px-6 py-24 animate-in">
      <Link
        href="/blog"
        className="flex items-center text-gray-400 hover:text-blue-600 transition-colors mb-16 group font-bold uppercase tracking-widest text-xs"
      >
        <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-2 transition-transform duration-300" />
        返回博客列表
      </Link>

      <article>
        <header className="mb-16">
          <time className="text-blue-600 font-mono text-sm mb-4 block">{post.date}</time>
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter leading-tight text-gray-900 mb-8">
            {post.title}
          </h1>
          <div className="flex gap-3">
            {post.tags.map(t => (
              <span
                key={t}
                className="px-3 py-1 bg-gray-100 text-gray-500 text-[10px] font-black uppercase tracking-widest rounded-md"
              >
                {t}
              </span>
            ))}
          </div>
        </header>

        <div className="prose prose-lg prose-blue max-w-none text-gray-600 leading-relaxed space-y-6">
          {post.content.split('\n').map((para, i) => {
            const trimmed = para.trim()
            if (!trimmed) return null
            if (trimmed.startsWith('## ')) {
              return (
                <h2 key={i} className="text-2xl font-black text-gray-900 mt-12 mb-4 tracking-tight">
                  {trimmed.replace('## ', '')}
                </h2>
              )
            }
            if (trimmed.match(/^\d+\./)) {
              return (
                <p key={i} className="text-gray-600 leading-relaxed pl-4 border-l-2 border-blue-100">
                  {trimmed}
                </p>
              )
            }
            return (
              <p key={i} className="text-gray-600 leading-relaxed">
                {trimmed}
              </p>
            )
          })}
        </div>
      </article>
    </div>
  )
}
