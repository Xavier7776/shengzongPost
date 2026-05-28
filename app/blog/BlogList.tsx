'use client'

// app/blog/BlogList.tsx — 卡片网格博客列表 + 分页 + 排序 + 标签筛选 + 动画
import { useState, useMemo, useRef, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import { ChevronRight, ChevronLeft, Search, X, Clock, Calendar, ArrowUpDown, Tag } from 'lucide-react'
import SectionHeading from '@/components/ui/SectionHeading'
import { hasRead } from '@/components/sections/ReadingHistory'

interface PostMeta {
  slug: string
  title: string
  excerpt: string
  tags: string[]
  created_at: string
  author_name?: string | null
  author_avatar?: string | null
}

interface BlogListProps {
  posts: PostMeta[]
  total: number
  page: number
  pageSize: number
}

type SortKey = 'newest' | 'oldest'

function readingTime(excerpt: string) {
  const mins = Math.max(1, Math.round(excerpt.length / 100))
  return `${mins} 分钟`
}

export default function BlogList({ posts, total, page, pageSize }: BlogListProps) {
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<SortKey>('newest')
  const [activeTag, setActiveTag] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const totalPages = Math.ceil(total / pageSize)

  // 提取所有热门标签
  const allTags = useMemo(() => {
    const count: Record<string, number> = {}
    posts.forEach(p => p.tags?.forEach(t => { count[t] = (count[t] ?? 0) + 1 }))
    return Object.entries(count)
      .sort((a, b) => b[1] - a[1])
      .map(([tag]) => tag)
      .slice(0, 8)
  }, [posts])

  const processed = useMemo(() => {
    let list = [...posts]

    // 标签筛选
    if (activeTag) {
      list = list.filter(p => p.tags?.some(t => t.toLowerCase() === activeTag.toLowerCase()))
    }

    // 搜索筛选
    const q = query.trim().toLowerCase()
    if (q) {
      list = list.filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.excerpt?.toLowerCase().includes(q) ||
        p.tags?.some(t => t.toLowerCase().includes(q))
      )
    }

    // 排序
    if (sort === 'oldest') {
      list.reverse()
    }

    return list
  }, [query, posts, sort, activeTag])

  const goToPage = (p: number) => {
    const params = new URLSearchParams(searchParams.toString())
    if (p <= 1) params.delete('page')
    else params.set('page', String(p))
    router.push(`/blog${params.toString() ? '?' + params.toString() : ''}`)
  }

  const isFiltering = query.trim().length > 0 || activeTag !== null

  return (
    <div className="max-w-[960px] mx-auto px-6 py-24 animate-in">
      <SectionHeading>技术随笔</SectionHeading>

      {/* 搜索框 */}
      <div className="relative mb-6 mt-2">
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

      {/* 标签筛选 + 排序 */}
      <div className="flex items-center justify-between gap-4 mb-8 flex-wrap">
        {/* 标签 */}
        {allTags.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <Tag className="w-3.5 h-3.5 text-gray-300 mr-1" />
            {activeTag && (
              <button
                onClick={() => setActiveTag(null)}
                className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"
              >
                全部
              </button>
            )}
            {allTags.map(tag => (
              <button
                key={tag}
                onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest transition-all duration-200 ${
                  activeTag === tag
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-gray-50 text-gray-400 border border-gray-100 hover:border-blue-300 hover:text-blue-600'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        )}

        {/* 排序 */}
        <div className="flex items-center gap-1 ml-auto">
          <ArrowUpDown className="w-3.5 h-3.5 text-gray-300" />
          <button
            onClick={() => setSort(s => s === 'newest' ? 'oldest' : 'newest')}
            className="text-xs text-gray-400 hover:text-blue-600 transition-colors font-medium"
          >
            {sort === 'newest' ? '最新优先' : '最早优先'}
          </button>
        </div>
      </div>

      {/* 搜索结果提示 */}
      {isFiltering && (
        <p className="text-xs text-gray-400 font-mono mb-6 -mt-4">
          {processed.length > 0
            ? `找到 ${processed.length} 篇文章`
            : '没有匹配的文章'}
        </p>
      )}

      {/* 空态 */}
      {processed.length === 0 && !isFiltering && (
        <p className="text-gray-400 text-lg mt-4">还没有文章，快去后台写一篇吧。</p>
      )}

      {processed.length === 0 && isFiltering && (
        <div className="flex flex-col items-center py-20 gap-3 text-gray-400">
          <Search className="w-10 h-10 opacity-30" />
          <p className="text-sm">没有找到匹配的文章</p>
          <button
            onClick={() => { setQuery(''); setActiveTag(null) }}
            className="text-xs text-blue-500 hover:underline mt-1"
          >
            清空筛选
          </button>
        </div>
      )}

      {/* 卡片网格 */}
      {processed.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {processed.map((post, i) => (
            <BlogCardItem key={post.slug} post={post} index={i} highlightQuery={query} />
          ))}
        </div>
      )}

      {/* 分页 */}
      {!isFiltering && totalPages > 1 && (
        <Pagination page={page} totalPages={totalPages} goToPage={goToPage} />
      )}
    </div>
  )
}

// ── 卡片组件（带入场动画 + hover 微交互）──────────────────────────
function BlogCardItem({ post, index, highlightQuery }: { post: PostMeta; index: number; highlightQuery?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [read, setRead] = useState(false)

  useEffect(() => {
    setRead(hasRead(post.slug))
  }, [post.slug])

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.unobserve(entry.target)
        }
      },
      { threshold: 0.1 }
    )
    observer.observe(el)
    return () => { observer.unobserve(el) }
  }, [])

  const firstTag = post.tags?.[0]

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`}
      style={{ transitionDelay: `${index * 80}ms` }}
    >
      <Link href={`/blog/${post.slug}`} className="group block">
        <article className="flex flex-col h-full bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:border-gray-200 hover:-translate-y-1 transition-all duration-300 p-5">
          {/* 标签角标 */}
          {firstTag && (
            <span className="text-[10px] font-black tracking-widest uppercase text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md inline-block mb-3 w-fit">
              {firstTag}
            </span>
          )}

          {/* 文字内容 */}
          <div className="flex flex-col flex-1">
            <h3 className={`text-base font-black mb-2 leading-snug group-hover:text-blue-600 transition-colors line-clamp-2 ${read ? 'text-gray-400' : 'text-gray-900'}`}>
              {highlightQuery ? <HighlightText text={post.title} query={highlightQuery} /> : post.title}
              {read && <span className="ml-2 text-[10px] font-bold text-gray-300 align-middle">已读</span>}
            </h3>
            <p className="text-sm text-gray-500 leading-relaxed line-clamp-2 mb-4 flex-1">
              {post.excerpt}
            </p>

            {/* 标签 */}
            {post.tags && post.tags.length > 1 && (
              <div className="flex flex-wrap gap-1.5 mb-4">
                {post.tags.slice(1).map(t => (
                  <span
                    key={t}
                    className="text-[10px] uppercase tracking-widest font-bold bg-gray-50 text-gray-400 px-2 py-0.5 rounded-md border border-gray-100"
                  >
                    {t}
                  </span>
                ))}
              </div>
            )}

            {/* 底部元信息 */}
            <div className="flex items-center gap-3 text-xs text-gray-400 pt-3 border-t border-gray-50 mt-auto">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {post.created_at.slice(0, 10)}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {readingTime(post.excerpt)}
              </span>
              {post.author_name && (
                <span className="flex items-center gap-1.5 ml-auto truncate min-w-0">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full overflow-hidden bg-blue-100 flex items-center justify-center">
                    {post.author_avatar
                      ? <Image src={post.author_avatar} alt={post.author_name} width={20} height={20} unoptimized className="w-full h-full object-cover" />
                      : <span className="text-blue-600 text-[9px] font-black">{post.author_name.charAt(0).toUpperCase()}</span>
                    }
                  </span>
                  <span className="truncate">{post.author_name}</span>
                </span>
              )}
            </div>
          </div>
        </article>
      </Link>
    </div>
  )
}

// ── 分页组件 ──────────────────────────────────────────────────────
function Pagination({ page, totalPages, goToPage }: { page: number; totalPages: number; goToPage: (p: number) => void }) {
  const pages: (number | '...')[] = []
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i)
  } else {
    pages.push(1)
    if (page > 3) pages.push('...')
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i)
    if (page < totalPages - 2) pages.push('...')
    pages.push(totalPages)
  }

  return (
    <div className="flex items-center justify-center gap-2 mt-16">
      <button
        onClick={() => goToPage(page - 1)}
        disabled={page <= 1}
        className="p-2 rounded-xl border border-gray-200 text-gray-500 hover:border-blue-400 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      {pages.map((p, i) =>
        p === '...' ? (
          <span key={`dots-${i}`} className="px-2 text-gray-300">…</span>
        ) : (
          <button
            key={p}
            onClick={() => goToPage(p)}
            className={`w-9 h-9 rounded-xl text-sm font-bold transition-colors ${
              p === page
                ? 'bg-blue-600 text-white'
                : 'border border-gray-200 text-gray-600 hover:border-blue-400 hover:text-blue-600'
            }`}
          >
            {p}
          </button>
        )
      )}

      <button
        onClick={() => goToPage(page + 1)}
        disabled={page >= totalPages}
        className="p-2 rounded-xl border border-gray-200 text-gray-500 hover:border-blue-400 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  )
}

// ── 高亮搜索词 ────────────────────────────────────────────────────
function HighlightText({ text, query }: { text: string; query: string }) {
  if (!query) return <>{text}</>
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(`(${escaped})`, 'gi')
  const parts = text.split(regex)
  return (
    <>
      {parts.map((part, i) =>
        // split + 捕获组：匹配项在奇数索引位
        i % 2 !== 0
          ? <mark key={i} className="bg-yellow-200 text-yellow-900 rounded px-0.5 not-italic">{part}</mark>
          : part
      )}
    </>
  )
}