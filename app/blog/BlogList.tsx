'use client'

// app/blog/BlogList.tsx — 混合型博客布局（左栏最新+热门，右栏分类+标签云+系列）
import { useState, useMemo, useRef, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  ChevronRight, ChevronLeft, Search, X, Clock, Calendar,
  ArrowUpDown, Tag, ArrowRight, Flame, FileText, Hash, Layers,
} from 'lucide-react'
import SectionHeading from '@/components/ui/SectionHeading'
import { hasRead } from '@/components/sections/ReadingHistory'

interface PostMeta {
  slug: string
  title: string
  excerpt: string
  tags: string[]
  created_at: string
  cover_image?: string | null
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

function isNew(dateStr: string): boolean {
  const date = new Date(dateStr)
  const now = new Date()
  const diffDays = (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
  return diffDays <= 3
}

// 彩色标签配色（循环使用）
const TAG_COLORS = [
  'bg-blue-50 text-blue-600 hover:bg-blue-100 border-blue-100',
  'bg-purple-50 text-purple-600 hover:bg-purple-100 border-purple-100',
  'bg-pink-50 text-pink-600 hover:bg-pink-100 border-pink-100',
  'bg-amber-50 text-amber-600 hover:bg-amber-100 border-amber-100',
  'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border-emerald-100',
  'bg-cyan-50 text-cyan-600 hover:bg-cyan-100 border-cyan-100',
  'bg-rose-50 text-rose-600 hover:bg-rose-100 border-rose-100',
  'bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border-indigo-100',
]

export default function BlogList({ posts, total, page, pageSize }: BlogListProps) {
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<SortKey>('newest')
  const [activeTag, setActiveTag] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const totalPages = Math.ceil(total / pageSize)

  // 所有标签（带计数）
  const allTags = useMemo(() => {
    const count: Record<string, number> = {}
    posts.forEach(p => p.tags?.forEach(t => { count[t] = (count[t] ?? 0) + 1 }))
    return Object.entries(count)
      .sort((a, b) => b[1] - a[1])
      .map(([tag, cnt]) => ({ tag, count: cnt }))
  }, [posts])

  // 分类导航：取所有文章的所有标签去重统计（不再只取第一个标签）
  const categories = useMemo(() => {
    const count: Record<string, number> = {}
    posts.forEach(p => p.tags?.forEach(t => { count[t] = (count[t] ?? 0) + 1 }))
    return Object.entries(count)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }))
      .slice(0, 8)
  }, [posts])

  const processed = useMemo(() => {
    let list = [...posts]

    if (activeTag) {
      list = list.filter(p => p.tags?.some(t => t.toLowerCase() === activeTag.toLowerCase()))
    }

    const q = query.trim().toLowerCase()
    if (q) {
      list = list.filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.excerpt?.toLowerCase().includes(q) ||
        p.tags?.some(t => t.toLowerCase().includes(q))
      )
    }

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
  // 仅在第一页 + 非筛选时展示混合布局
  const showMixedLayout = !isFiltering && page === 1

  // 最新文章（前 3 篇）+ 热门文章（4-8 篇）
  const latestPosts = showMixedLayout ? processed.slice(0, 3) : []
  const popularPosts = showMixedLayout ? processed.slice(3, 8) : []
  const restPosts = showMixedLayout ? processed.slice(8) : processed

  return (
    <div className="max-w-6xl mx-auto px-6 py-24 animate-in">
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

      {/* 筛选状态下的标签栏 + 排序 */}
      {!showMixedLayout && (
        <div className="flex items-center justify-between gap-4 mb-8 flex-wrap">
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
              {allTags.slice(0, 10).map(({ tag }) => (
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
      )}

      {/* 搜索结果提示 */}
      {isFiltering && (
        <p className="text-xs text-gray-400 font-mono mb-6">
          {processed.length > 0 ? `找到 ${processed.length} 篇文章` : '没有匹配的文章'}
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

      {/* ════════════════════════════════════════════════════════════
        混合型布局：左栏（最新+热门）+ 右栏（分类+标签云+系列）
        仅在第一页 + 非筛选时展示
      ════════════════════════════════════════════════════════════ */}
      {showMixedLayout && processed.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8 mb-12">
          {/* ── 左栏：主内容区 ── */}
          <div className="space-y-6 min-w-0">
            {/* 最新文章卡片 */}
            {latestPosts.length > 0 && (
              <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
                  <h2 className="flex items-center gap-2 text-sm font-black text-gray-900">
                    <FileText className="w-4 h-4 text-blue-500" />
                    最新文章
                  </h2>
                  <Link
                    href="/blog?page=2"
                    className="flex items-center gap-1 text-xs font-bold text-gray-400 hover:text-blue-600 transition-colors"
                  >
                    更多 <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>
                <ul className="divide-y divide-gray-50">
                  {latestPosts.map((post, i) => (
                    <LatestPostRow key={post.slug} post={post} rank={i + 1} />
                  ))}
                </ul>
              </section>
            )}

            {/* 热门文章卡片 */}
            {popularPosts.length > 0 && (
              <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
                  <h2 className="flex items-center gap-2 text-sm font-black text-gray-900">
                    <Flame className="w-4 h-4 text-orange-500" />
                    热门文章
                  </h2>
                  <span className="text-xs text-gray-400">精选推荐</span>
                </div>
                <ul className="divide-y divide-gray-50">
                  {popularPosts.map((post, i) => (
                    <PopularPostRow key={post.slug} post={post} rank={i + 1} />
                  ))}
                </ul>
              </section>
            )}
          </div>

          {/* ── 右栏：侧边栏 ── */}
          <aside className="space-y-6">
            {/* 分类导航 */}
            {categories.length > 0 && (
              <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-50">
                  <h2 className="flex items-center gap-2 text-sm font-black text-gray-900">
                    <Layers className="w-4 h-4 text-purple-500" />
                    分类导航
                  </h2>
                </div>
                <ul className="py-2">
                  {categories.map(cat => (
                    <li key={cat.name}>
                      <button
                        onClick={() => setActiveTag(cat.name)}
                        className="w-full flex items-center justify-between px-6 py-2.5 text-sm text-gray-600 hover:bg-gray-50 hover:text-blue-600 transition-colors group"
                      >
                        <span className="flex items-center gap-2 min-w-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-gray-300 group-hover:bg-blue-500 transition-colors flex-shrink-0" />
                          <span className="truncate">{cat.name}</span>
                        </span>
                        <span className="text-xs text-gray-400 font-mono flex-shrink-0">{cat.count}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* 标签云（彩色 badge） */}
            {allTags.length > 0 && (
              <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-50">
                  <h2 className="flex items-center gap-2 text-sm font-black text-gray-900">
                    <Hash className="w-4 h-4 text-pink-500" />
                    标签云
                  </h2>
                </div>
                <div className="p-5 flex flex-wrap gap-2">
                  {allTags.slice(0, 16).map(({ tag, count }, i) => (
                    <button
                      key={tag}
                      onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                      className={`text-xs font-bold px-2.5 py-1 rounded-full border transition-all duration-200 hover:scale-105 ${
                        activeTag === tag
                          ? 'bg-blue-600 text-white border-blue-600'
                          : TAG_COLORS[i % TAG_COLORS.length]
                      }`}
                    >
                      {tag}
                      <span className="ml-1 text-[10px] opacity-60">{count}</span>
                    </button>
                  ))}
                </div>
              </section>
            )}
          </aside>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════
        全部文章列表（混合布局下方 / 筛选状态下）
      ════════════════════════════════════════════════════════════ */}
      {processed.length > 0 && (
        <>
          {showMixedLayout && restPosts.length > 0 && (
            <div className="mb-6">
              <h2 className="flex items-center gap-2 text-sm font-black text-gray-900 mb-4">
                <FileText className="w-4 h-4 text-gray-400" />
                全部文章
                <span className="text-xs text-gray-400 font-normal ml-1">共 {total} 篇</span>
              </h2>
            </div>
          )}

          {/* 文章列表（紧凑左图右文式） */}
          {(showMixedLayout ? restPosts : processed).length > 0 && (
            <div className="space-y-4">
              {(showMixedLayout ? restPosts : processed).map((post, i) => (
                <ArticleListItem key={post.slug} post={post} index={i} highlightQuery={query} />
              ))}
            </div>
          )}
        </>
      )}

      {/* 分页 */}
      {!isFiltering && totalPages > 1 && (
        <Pagination page={page} totalPages={totalPages} goToPage={goToPage} />
      )}
    </div>
  )
}

// ── 最新文章行（精简：序号 + 标题 + 日期） ────────────────────────
function LatestPostRow({ post, rank }: { post: PostMeta; rank: number }) {
  const [read, setRead] = useState(false)
  useEffect(() => { setRead(hasRead(post.slug)) }, [post.slug])

  return (
    <li>
      <Link
        href={`/blog/${post.slug}`}
        className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50/60 transition-colors group"
      >
        <span className={`text-2xl font-black flex-shrink-0 w-8 text-center ${
          rank === 1 ? 'text-blue-500' : rank === 2 ? 'text-purple-400' : 'text-gray-300'
        }`}>
          {rank}
        </span>
        <div className="flex-1 min-w-0">
          <h3 className={`text-sm font-bold leading-snug group-hover:text-blue-600 transition-colors truncate ${
            read ? 'text-gray-400' : 'text-gray-900'
          }`}>
            {post.title}
            {read && <span className="ml-2 text-[10px] font-bold text-gray-300 align-middle">已读</span>}
          </h3>
          <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {post.created_at.slice(0, 10)}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {readingTime(post.excerpt)}
            </span>
            {post.tags?.[0] && (
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded">
                {post.tags[0]}
              </span>
            )}
          </div>
        </div>
        <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all flex-shrink-0" />
      </Link>
    </li>
  )
}

// ── 热门文章行（带封面缩略图） ────────────────────────────────────
function PopularPostRow({ post, rank }: { post: PostMeta; rank: number }) {
  const [read, setRead] = useState(false)
  useEffect(() => { setRead(hasRead(post.slug)) }, [post.slug])

  return (
    <li>
      <Link
        href={`/blog/${post.slug}`}
        className="flex items-center gap-4 px-6 py-3.5 hover:bg-gray-50/60 transition-colors group"
      >
        {/* 序号 */}
        <span className={`text-xs font-black flex-shrink-0 w-6 text-center ${
          rank <= 3 ? 'text-orange-500' : 'text-gray-300'
        }`}>
          {rank}
        </span>

        {/* 缩略图 */}
        <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
          {post.cover_image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={post.cover_image} alt={post.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-400" />
            </div>
          )}
        </div>

        {/* 文字 */}
        <div className="flex-1 min-w-0">
          <h3 className={`text-sm font-bold leading-snug group-hover:text-blue-600 transition-colors line-clamp-1 ${
            read ? 'text-gray-400' : 'text-gray-900'
          }`}>
            {post.title}
          </h3>
          <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
            <span>{post.created_at.slice(0, 10)}</span>
            {post.tags?.[0] && (
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 bg-gray-50 px-1.5 py-0.5 rounded">
                {post.tags[0]}
              </span>
            )}
          </div>
        </div>
      </Link>
    </li>
  )
}

// ── 文章列表项（左图右文，紧凑式） ────────────────────────────────
function ArticleListItem({ post, index, highlightQuery }: { post: PostMeta; index: number; highlightQuery?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [read, setRead] = useState(false)

  useEffect(() => { setRead(hasRead(post.slug)) }, [post.slug])

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

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
      style={{ transitionDelay: `${Math.min(index * 60, 400)}ms` }}
    >
      <Link href={`/blog/${post.slug}`} className="group block">
        <article className="flex gap-5 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:border-gray-200 transition-all duration-300 p-4 md:p-5">
          {/* 左侧封面图 */}
          <div className="w-24 h-24 md:w-32 md:h-32 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
            {post.cover_image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={post.cover_image} alt={post.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 flex items-center justify-center">
                <FileText className="w-8 h-8 text-blue-400" />
              </div>
            )}
          </div>

          {/* 右侧文字 */}
          <div className="flex flex-col flex-1 min-w-0">
            {/* 标签 + NEW */}
            <div className="flex items-center gap-2 mb-2">
              {post.tags?.[0] && (
                <span className="text-[10px] font-black tracking-widest uppercase text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                  {post.tags[0]}
                </span>
              )}
              {isNew(post.created_at) && (
                <span className="bg-gradient-to-r from-orange-400 to-amber-400 text-white text-[9px] font-extrabold tracking-wider px-2 py-0.5 rounded-full">
                  NEW
                </span>
              )}
              {read && (
                <span className="text-[10px] font-bold text-gray-300 bg-gray-50 px-1.5 py-0.5 rounded">已读</span>
              )}
            </div>

            {/* 标题 */}
            <h3 className={`text-base md:text-lg font-black mb-1.5 leading-snug group-hover:text-blue-600 transition-colors line-clamp-2 ${
              read ? 'text-gray-400' : 'text-gray-900'
            }`}>
              {highlightQuery ? <HighlightText text={post.title} query={highlightQuery} /> : post.title}
            </h3>

            {/* 摘要 */}
            <p className="text-sm text-gray-500 leading-relaxed line-clamp-2 mb-2 flex-1">
              {post.excerpt}
            </p>

            {/* 底部元信息 */}
            <div className="flex items-center gap-3 text-xs text-gray-400 mt-auto">
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
                  <span className="truncate hidden sm:inline">{post.author_name}</span>
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
        i % 2 !== 0
          ? <mark key={i} className="bg-yellow-200 text-yellow-900 rounded px-0.5 not-italic">{part}</mark>
          : part
      )}
    </>
  )
}
