'use client'

// app/blog/BlogList.tsx — 带标题搜索的博客列表
import { useState, useMemo } from 'react'
import Link from 'next/link'
import { ChevronRight, Search, X } from 'lucide-react'
import SectionHeading from '@/components/ui/SectionHeading'

interface PostMeta {
  slug: string
  title: string
  excerpt: string
  tags: string[]
  created_at: string
}

export default function BlogList({ posts }: { posts: PostMeta[] }) {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return posts
    return posts.filter(p =>
      p.title.toLowerCase().includes(q) ||
      p.excerpt?.toLowerCase().includes(q) ||
      p.tags?.some(t => t.toLowerCase().includes(q))
    )
  }, [query, posts])

  return (
    <div className="max-w-[800px] mx-auto px-6 py-24 animate-in">
      <SectionHeading>技术随笔</SectionHeading>

      {/* 搜索框 */}
      <div className="relative mb-12 mt-2">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="搜索标题、摘要或标签…"
          className="w-full pl-11 pr-10 py-3 bg-white border border-gray-200 rounded-2xl text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:border-blue-400 transition-colors shadow-sm"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* 搜索结果提示 */}
      {query && (
        <p className="text-xs text-gray-400 font-mono mb-8 -mt-6">
          {filtered.length > 0
            ? `找到 ${filtered.length} 篇文章`
            : '没有匹配的文章'}
        </p>
      )}

      {/* 空态 */}
      {filtered.length === 0 && !query && (
        <p className="text-gray-400 text-lg mt-4">还没有文章，快去后台写一篇吧。</p>
      )}

      {filtered.length === 0 && query && (
        <div className="flex flex-col items-center py-20 gap-3 text-gray-400">
          <Search className="w-10 h-10 opacity-30" />
          <p className="text-sm">没有找到包含「{query}」的文章</p>
          <button onClick={() => setQuery('')} className="text-xs text-blue-500 hover:underline mt-1">
            清空搜索
          </button>
        </div>
      )}

      {/* 文章列表 */}
      <div className="space-y-16">
        {filtered.map((post, i) => (
          <Link key={post.slug} href={`/blog/${post.slug}`} className="group block">
            <time className="text-sm text-blue-600 font-mono mb-4 block">
              {post.created_at.slice(0, 10)}
            </time>
            <h3 className="text-3xl font-black text-gray-900 mb-4 group-hover:text-blue-600 transition-colors tracking-tighter leading-tight">
              {/* 高亮匹配词 */}
              {query ? <HighlightText text={post.title} query={query} /> : post.title}
            </h3>
            <p className="text-gray-500 text-lg leading-relaxed mb-4 line-clamp-2">{post.excerpt}</p>

            {/* 标签 */}
            {post.tags?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-4">
                {post.tags.map(tag => (
                  <span
                    key={tag}
                    className={`text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest transition-colors ${
                      query && tag.toLowerCase().includes(query.toLowerCase())
                        ? 'bg-blue-100 text-blue-600'
                        : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            <span className="text-blue-600 text-xs font-black uppercase tracking-widest flex items-center group-hover:gap-2 transition-all">
              阅读全文
              <ChevronRight className="w-4 h-4 ml-1" />
            </span>
            {i < filtered.length - 1 && <div className="h-px bg-gray-100 w-full mt-16" />}
          </Link>
        ))}
      </div>
    </div>
  )
}

// 高亮搜索词
function HighlightText({ text, query }: { text: string; query: string }) {
  if (!query) return <>{text}</>
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
  const parts = text.split(regex)
  return (
    <>
      {parts.map((part, i) =>
        regex.test(part)
          ? <mark key={i} className="bg-yellow-200 text-yellow-900 rounded px-0.5 not-italic">{part}</mark>
          : part
      )}
    </>
  )
}
