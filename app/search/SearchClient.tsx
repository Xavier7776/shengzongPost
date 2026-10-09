'use client'
// app/search/SearchClient.tsx
// 全站搜索客户端组件：搜索框 + 分类 Tab + 结果列表
// 增强：关键词高亮、搜索历史、空结果推荐
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Search, Loader2, FileText, Code2, Image as ImageIcon, X, Clock, TrendingUp } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { parseSearchParams } from '@/lib/search'
import type { SearchResponse, SearchType, SearchSort } from '@/lib/search'

const TYPE_META: Record<string, { label: string; icon: typeof FileText; color: string; bg: string }> = {
  post:    { label: '博客',  icon: FileText,  color: 'text-blue-600',   bg: 'bg-blue-50 border-blue-200' },
  skill:   { label: 'Skill', icon: Code2,     color: 'text-violet-600', bg: 'bg-violet-50 border-violet-200' },
  gallery: { label: '画廊',  icon: ImageIcon, color: 'text-pink-600',   bg: 'bg-pink-50 border-pink-200' },
}

const CATEGORY_LABELS: Record<string, string> = {
  coding: '编程开发',
  research: '学术研究',
  creative: '创意设计',
  automation: '自动化',
  productivity: '效率工具',
  other: 'AI 工具',
}

const HISTORY_KEY = 'mindstack:search-history'
const MAX_HISTORY = 10

function HighlightText({ text, keyword }: { text: string; keyword: string }) {
  if (!keyword) return <>{text}</>
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return <>{text.split(new RegExp(`(${escaped})`, 'gi')).map((part, i) =>
    i % 2 ? <mark key={i} className="bg-yellow-200 text-gray-900 rounded px-0.5">{part}</mark> : part
  )}</>
}

// 读取搜索历史
function loadHistory(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    if (!raw) return []
    const arr = JSON.parse(raw)
    return Array.isArray(arr) ? arr.filter(x => typeof x === 'string' && x.length <= 120).slice(0, MAX_HISTORY) : []
  } catch {
    return []
  }
}

// 保存搜索历史(去重,最多 MAX_HISTORY 条,新的放前面),返回新列表
function saveHistory(keyword: string): string[] {
  if (typeof window === 'undefined') return []
  const q = keyword.trim()
  if (!q) return loadHistory()
  try {
    const current = loadHistory()
    const filtered = current.filter(item => item !== q)
    const next = [q, ...filtered].slice(0, MAX_HISTORY)
    localStorage.setItem(HISTORY_KEY, JSON.stringify(next))
    return next
  } catch {
    return loadHistory()
  }
}

// 删除单条历史,返回新列表
function removeHistoryItem(keyword: string): string[] {
  if (typeof window === 'undefined') return []
  try {
    const current = loadHistory()
    const next = current.filter(item => item !== keyword)
    localStorage.setItem(HISTORY_KEY, JSON.stringify(next))
    return next
  } catch {
    return loadHistory()
  }
}

// 清空历史,返回空列表
function clearHistory(): string[] {
  if (typeof window === 'undefined') return []
  try {
    localStorage.removeItem(HISTORY_KEY)
  } catch {}
  return []
}

// 推荐文章类型(来自 /api/posts/public)
interface RecommendPost {
  slug: string
  title: string
  excerpt: string
  cover_image: string | null
  author_name: string | null
  created_at: string
}

export default function SearchClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const urlState = searchParams.toString()
  let state
  let parameterError = ''
  try {
    state = parseSearchParams(new URLSearchParams(urlState))
  } catch (err) {
    parameterError = (err as Error).message
    state = { q: (searchParams.get('q') ?? '').slice(0, 120), type: 'all' as const, sort: 'relevance' as const, page: 1, pageSize: 20 }
  }
  const { q, type: activeType, sort, page } = state
  const [query, setQuery] = useState(q)
  const [data, setData] = useState<SearchResponse | null>(null)
  const [loading, setLoading] = useState(Boolean(q))
  const [error, setError] = useState('')
  const [retry, setRetry] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const controllerRef = useRef<AbortController | null>(null)
  const requestRef = useRef(0)
  const [history, setHistory] = useState<string[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [recommendations, setRecommendations] = useState<RecommendPost[]>([])
  const [loadingRecommendations, setLoadingRecommendations] = useState(false)

  useEffect(() => {
    setHistory(loadHistory())
    inputRef.current?.focus()
  }, [])

  function cancelPending() {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    controllerRef.current?.abort()
    requestRef.current++
  }

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    setQuery(q)
    setData(null)
    setError(parameterError)
    setLoading(Boolean(q) && !parameterError)
    if (!q || parameterError) return
    const controller = new AbortController()
    controllerRef.current = controller
    const request = ++requestRef.current
    let active = true
    let timedOut = false
    const timeout = setTimeout(() => { timedOut = true; controller.abort() }, 15000)
    const params = new URLSearchParams(urlState)
    params.set('q', q)
    setHistory(saveHistory(q))
    async function run() {
      try {
        const response = await fetch(`/api/search?${params}`, { signal: controller.signal })
        if (!response.ok) throw new Error('搜索失败，请稍后重试')
        const result: SearchResponse = await response.json()
        if (active && request === requestRef.current && !controller.signal.aborted) setData(result)
      } catch {
        if (active && request === requestRef.current) setError(timedOut ? '搜索超时，请重试' : '搜索失败，请稍后重试')
      } finally {
        clearTimeout(timeout)
        if (active && request === requestRef.current) setLoading(false)
      }
    }
    void run()
    return () => {
      active = false
      controller.abort()
      clearTimeout(timeout)
    }
  }, [urlState, q, parameterError, retry])

  function navigate(value: string, next: { type?: SearchType; sort?: SearchSort; page?: number } = {}, replace = false) {
    cancelPending()
    setQuery(value)
    setShowHistory(false)
    setData(null)
    setError('')
    setLoading(Boolean(value.trim()))
    const params = new URLSearchParams({
      q: value.trim(), type: next.type ?? activeType,
      sort: next.sort ?? sort, page: String(next.page ?? 1),
    })
    const target = value.trim() ? `/search?${params}` : '/search'
    if (target === `/search${urlState ? `?${urlState}` : ''}`) setRetry(n => n + 1)
    else if (replace) router.replace(target, { scroll: false })
    else router.push(target, { scroll: false })
  }

  const handleInput = (value: string) => {
    cancelPending()
    setQuery(value)
    setShowHistory(false)
    setData(null)
    setError('')
    setLoading(Boolean(value.trim()))
    debounceRef.current = setTimeout(() => navigate(value, {}, true), 350)
  }
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.nativeEvent.isComposing) navigate(query)
  }
  const handleClear = () => { navigate(''); setShowHistory(true); inputRef.current?.focus() }
  const handleHistoryClick = (item: string) => navigate(item)
  const handleSuggestionClick = (item: string) => navigate(item)
  const handleHistoryRemove = (e: React.MouseEvent, item: string) => {
    e.stopPropagation()
    e.preventDefault()
    setHistory(removeHistoryItem(item))
  }
  const handleHistoryClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    setHistory(clearHistory())
  }
  const handleFocus = () => { if (!query.trim()) setShowHistory(true) }
  const handleBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    if (!e.currentTarget.contains(e.relatedTarget)) setShowHistory(false)
  }

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  useEffect(() => {
    setRecommendations([])
    setLoadingRecommendations(false)
    // An empty page or empty category is not an empty full-site search.
    if (!data || data.counts.all !== 0 || loading || error || !data.q) return
    const controller = new AbortController()
    let active = true
    const timeout = setTimeout(() => controller.abort(), 15000)
    setLoadingRecommendations(true)
    fetch('/api/posts/public?limit=4', { signal: controller.signal })
      .then(res => { if (!res.ok) throw new Error('recommendations'); return res.json() })
      .then((posts: RecommendPost[]) => { if (!controller.signal.aborted) setRecommendations(Array.isArray(posts) ? posts : []) })
      .catch(() => {})
      .finally(() => { clearTimeout(timeout); if (active) setLoadingRecommendations(false) })
    return () => { active = false; controller.abort(); clearTimeout(timeout) }
  }, [data, loading, error])

  const results = data?.results ?? []
  const counts = data?.counts ?? { all: 0, post: 0, skill: 0, gallery: 0 }
  const searched = Boolean(q)
  const tabs: Array<{ key: 'all' | 'post' | 'skill' | 'gallery'; label: string; count: number }> = [
    { key: 'all', label: '全部', count: counts.all },
    { key: 'post', label: '博客', count: counts.post },
    { key: 'skill', label: 'Skills', count: counts.skill },
    { key: 'gallery', label: '画廊', count: counts.gallery },
  ]

  // 当前用于高亮的关键词
  const highlightTerm = data?.q ?? q

  return (
    <div className="max-w-6xl mx-auto px-6 py-24">
      {/* 标题 */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-900 tracking-tight mb-2">搜索</h1>
        <p className="text-sm text-gray-500">在博客、Skills、画廊中搜索内容</p>
      </div>

      {/* 搜索框 */}
      <div className="relative mb-6" onBlur={handleBlur}>
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 z-10" />
        <input
          ref={inputRef}
          type="text"
          aria-label="全站搜索关键词"
          maxLength={120}
          value={query}
          onChange={e => handleInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          placeholder="输入关键词…"
          className="w-full pl-12 pr-12 py-4 text-base bg-white border border-gray-200 rounded-2xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
        />
        {query && (
          <button
            onClick={handleClear}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors z-10"
            aria-label="清空"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        )}

        {/* 搜索历史下拉(仅当输入框有焦点且内容为空时显示) */}
        {showHistory && !query.trim() && history.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden z-20">
            <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100">
              <span className="flex items-center gap-1.5 text-xs font-bold text-gray-500">
                <Clock className="w-3.5 h-3.5" />
                搜索历史
              </span>
              <button
                onMouseDown={e => e.preventDefault()}
                onClick={handleHistoryClear}
                className="text-xs text-gray-400 hover:text-red-500 transition-colors"
              >
                清除历史
              </button>
            </div>
            <ul className="max-h-80 overflow-y-auto">
              {history.map((item) => (
                <li key={item}>
                  <div
                    className="flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 cursor-pointer group"
                  >
                    <button
                      aria-label={`搜索 ${item}`}
                      onMouseDown={e => e.preventDefault()}
                      onClick={() => handleHistoryClick(item)}
                      className="flex flex-1 min-w-0 items-center gap-2 text-sm text-gray-700 text-left"
                    >
                      <Clock className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
                      <span className="truncate">{item}</span>
                    </button>
                    <button
                      onMouseDown={e => e.preventDefault()}
                      onClick={(e) => handleHistoryRemove(e, item)}
                      className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full text-gray-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all"
                      aria-label="删除该历史"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {searched && !error && <>
          {/* 分类 Tab */}
          {(
            <div role="tablist" aria-label="搜索分类" className="flex items-center gap-2 mb-6 border-b border-gray-100 pb-3 overflow-x-auto">
              {tabs.map(tab => (
                <button
                  key={tab.key}
                  role="tab"
                  aria-label={`${tab.label} ${loading ? '搜索中' : tab.count}`}
                  aria-selected={activeType === tab.key}
                  onClick={() => navigate(query, { type: tab.key })}
                  className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activeType === tab.key
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  {tab.label}
                  <span className={`ml-1.5 ${activeType === tab.key ? 'text-gray-300' : 'text-gray-400'}`}>
                    {loading ? '…' : tab.count}
                  </span>
                </button>
              ))}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 mb-6 text-sm text-gray-500">
            <span role="status">{data ? `共 ${data.total} 条结果` : '搜索中…'}</span>
            <select aria-label="搜索排序" value={sort} onChange={e => navigate(query, { sort: e.target.value as SearchSort })} className="border border-gray-200 rounded-lg p-2 bg-white text-gray-700">
              <option value="relevance">相关性优先</option>
              <option value="newest">最新优先</option>
            </select>
          </div>

      </>}

      {loading && (
        <div className="flex items-center justify-center py-12 gap-2 text-gray-400">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">搜索中…</span>
        </div>
      )}

      {/* 结果 */}
      {!loading && searched && !error && data && (
        <>
          {/* 空结果 + 推荐 */}
          {results.length === 0 && (
            <div className="flex flex-col items-center py-10 gap-3 text-gray-400">
              <Search className="w-12 h-12 opacity-30" />
              <p className="text-sm">没有找到与「{query}」相关的内容</p>
              <p className="text-xs text-gray-400">{data.total > 0 ? '当前页没有结果，请返回前一页' : '试试其他关键词或分类'}</p>

              {/* 推荐内容 */}
              {data.counts.all === 0 && <div className="w-full mt-6">
                <div className="flex items-center gap-2 mb-4 justify-center">
                  <TrendingUp className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-bold text-gray-600">未找到相关结果,试试这些最新内容</span>
                </div>
                {loadingRecommendations ? (
                  <div className="flex items-center justify-center py-8 gap-2 text-gray-400">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-xs">加载推荐中…</span>
                  </div>
                ) : recommendations.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {recommendations.map((post) => (
                      <Link
                        key={post.slug}
                        href={`/blog/${post.slug}`}
                        className="group flex items-start gap-3 bg-white border border-gray-100 rounded-xl p-3 hover:border-gray-200 hover:shadow-sm transition-all"
                      >
                        {post.cover_image && (
                          <div className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-gray-100">
                            <Image
                              src={post.cover_image}
                              alt={post.title}
                              width={64}
                              height={64}
                              unoptimized
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-bold text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors">
                            {post.title}
                          </h4>
                          {post.excerpt && (
                            <p className="text-xs text-gray-500 line-clamp-2 mt-1">{post.excerpt}</p>
                          )}
                          {post.author_name && (
                            <p className="text-[10px] text-gray-400 mt-1">by {post.author_name}</p>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-xs text-gray-300 py-4">暂无推荐内容</p>
                )}
              </div>}
            </div>
          )}

          {/* 结果列表 */}
          {results.length > 0 && (
            <div className="space-y-3">
              {results.map((r) => {
                const meta = TYPE_META[r.type]
                const Icon = meta.icon
                return (
                  <Link
                    key={`${r.type}-${r.id}`}
                    href={r.url}
                    className="group block bg-white border border-gray-100 rounded-xl p-4 hover:border-gray-200 hover:shadow-sm transition-all"
                  >
                    <div className="flex items-start gap-4">
                      {/* 缩略图 */}
                      {r.image && (
                        <div className="flex-shrink-0 w-12 h-12 md:w-16 md:h-16 rounded-lg overflow-hidden bg-gray-100">
                          <Image
                            src={r.image}
                            alt={r.title}
                            width={64}
                            height={64}
                            unoptimized
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}

                      {/* 内容 */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest ${meta.color} ${meta.bg} border px-2 py-0.5 rounded-md`}>
                            <Icon className="w-3 h-3" />
                            {meta.label}
                          </span>
                          {r.meta && r.type === 'skill' && (
                            <span className="text-[10px] text-gray-400">
                              {CATEGORY_LABELS[r.meta] ?? r.meta}
                            </span>
                          )}
                          {r.meta && r.type === 'post' && (
                            <span className="text-[10px] text-gray-400">by {r.meta}</span>
                          )}
                        </div>
                        <h3 className="text-sm font-bold text-gray-900 break-words group-hover:text-blue-600 transition-colors mb-1">
                          <HighlightText text={r.title} keyword={highlightTerm} />
                        </h3>
                        {r.excerpt && (
                          <p className="text-xs text-gray-500 break-words line-clamp-2">
                            <HighlightText text={r.excerpt} keyword={highlightTerm} />
                          </p>
                        )}
                        {r.tags && r.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {r.tags.slice(0, 3).map(tag => (
                              <span key={tag} className="text-[10px] text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
          {(data.totalPages > 1 || page > 1) && (
            <nav aria-label="搜索分页" className="flex items-center justify-center gap-3 mt-8 text-sm">
              <button disabled={page <= 1} onClick={() => navigate(query, { page: page - 1 })} className="border rounded-lg px-3 py-2 disabled:opacity-40">上一页</button>
              <span>第 {page} / {data.totalPages} 页</span>
              <button disabled={page >= data.totalPages} onClick={() => navigate(query, { page: page + 1 })} className="border rounded-lg px-3 py-2 disabled:opacity-40">下一页</button>
            </nav>
          )}
        </>
      )}

      {error && <div role="alert" className="py-12 text-center text-red-600">
        <p>{error}</p>
        <button onClick={() => navigate(query)} className="mt-3 text-sm underline">重新搜索</button>
      </div>}

      {/* 初始状态(未搜索) */}
      {!searched && !loading && (
        <div className="flex flex-col items-center py-20 gap-4 text-gray-400">
          <Search className="w-12 h-12 opacity-30" />
          <p className="text-sm">输入关键词开始搜索</p>
          <div className="flex flex-wrap gap-2 justify-center max-w-md">
            {['Next.js', 'AI Agent', 'TypeScript', '自动化', 'Rust'].map(s => (
              <button
                key={s}
                onClick={() => handleSuggestionClick(s)}
                className="text-xs text-gray-500 bg-gray-50 hover:bg-gray-100 px-3 py-1.5 rounded-full transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
