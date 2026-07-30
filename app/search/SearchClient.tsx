'use client'
// app/search/SearchClient.tsx
// 全站搜索客户端组件：搜索框 + 分类 Tab + 结果列表
// 增强：关键词高亮、搜索历史、空结果推荐
import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Search, Loader2, FileText, Code2, Image as ImageIcon, X, Clock, TrendingUp } from 'lucide-react'
import type { SearchResult } from '@/lib/db-search'

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

// 转义 HTML 特殊字符,防止 XSS
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

// 转义正则表达式特殊字符
function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// 高亮关键词:先转义 HTML,再用 <mark> 标签包裹匹配项(大小写不敏感)
function highlightKeyword(text: string, keyword: string): string {
  if (!text) return ''
  if (!keyword || !keyword.trim()) return escapeHtml(text)
  const safeText = escapeHtml(text)
  const safeKeyword = escapeHtml(keyword)
  if (!safeKeyword) return safeText
  try {
    const re = new RegExp(escapeRegExp(safeKeyword), 'gi')
    return safeText.replace(re, (match) => `<mark class="bg-yellow-200 text-gray-900 rounded px-0.5">${match}</mark>`)
  } catch {
    return safeText
  }
}

// 读取搜索历史
function loadHistory(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    if (!raw) return []
    const arr = JSON.parse(raw)
    return Array.isArray(arr) ? arr.filter(x => typeof x === 'string').slice(0, MAX_HISTORY) : []
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

export default function SearchClient({ initialQuery }: { initialQuery: string }) {
  const [query, setQuery] = useState(initialQuery)
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [activeType, setActiveType] = useState<'all' | 'post' | 'skill' | 'gallery'>('all')
  const [searched, setSearched] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  // 搜索历史相关状态
  const [history, setHistory] = useState<string[]>([])
  const [showHistory, setShowHistory] = useState(false)

  // 推荐内容相关状态
  const [recommendations, setRecommendations] = useState<RecommendPost[]>([])
  const [loadingRecommendations, setLoadingRecommendations] = useState(false)

  // 初始化:加载历史
  useEffect(() => {
    setHistory(loadHistory())
  }, [])

  // 执行搜索(保持原有请求逻辑,仅在空查询时清理推荐)
  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([])
      setSearched(false)
      setRecommendations([])
      return
    }
    setLoading(true)
    setSearched(true)
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&limit=30`)
      const data = await res.json()
      setResults(data.results ?? [])
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [])

  // 初始查询
  useEffect(() => {
    if (initialQuery) {
      doSearch(initialQuery)
      // 初始查询(来自 URL)也保存到历史
      setHistory(saveHistory(initialQuery))
    }
    inputRef.current?.focus()
  }, [initialQuery, doSearch])

  // 防抖搜索
  const handleInput = (value: string) => {
    setQuery(value)
    // 输入内容时隐藏历史下拉
    if (value.trim()) {
      setShowHistory(false)
    }
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      doSearch(value)
      // 同步 URL(不触发导航)
      const url = new URL(window.location.href)
      if (value) {
        url.searchParams.set('q', value)
      } else {
        url.searchParams.delete('q')
      }
      window.history.replaceState({}, '', url.toString())
    }, 350)
  }

  // 回车搜索:保存到历史
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const q = query.trim()
      if (q) {
        if (debounceRef.current) clearTimeout(debounceRef.current)
        doSearch(q)
        setShowHistory(false)
        setHistory(saveHistory(q))
        // 同步 URL
        const url = new URL(window.location.href)
        url.searchParams.set('q', q)
        window.history.replaceState({}, '', url.toString())
      }
    }
  }

  // 清空
  const handleClear = () => {
    setQuery('')
    setResults([])
    setSearched(false)
    setRecommendations([])
    inputRef.current?.focus()
    const url = new URL(window.location.href)
    url.searchParams.delete('q')
    window.history.replaceState({}, '', url.toString())
  }

  // 从历史项搜索
  const handleHistoryClick = (item: string) => {
    setQuery(item)
    setShowHistory(false)
    doSearch(item)
    setHistory(saveHistory(item))
    const url = new URL(window.location.href)
    url.searchParams.set('q', item)
    window.history.replaceState({}, '', url.toString())
  }

  // 删除单条历史
  const handleHistoryRemove = (e: React.MouseEvent, item: string) => {
    e.stopPropagation()
    e.preventDefault()
    setHistory(removeHistoryItem(item))
  }

  // 清空历史
  const handleHistoryClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    setHistory(clearHistory())
  }

  // 输入框获得焦点:内容为空时显示历史
  const handleFocus = () => {
    if (!query.trim()) {
      setShowHistory(true)
    }
  }

  // 输入框失去焦点(延迟,以便点击历史项能先触发)
  const handleBlur = () => {
    setTimeout(() => setShowHistory(false), 150)
  }

  // 从推荐词搜索
  const handleSuggestionClick = (s: string) => {
    setQuery(s)
    setShowHistory(false)
    doSearch(s)
    setHistory(saveHistory(s))
    const url = new URL(window.location.href)
    url.searchParams.set('q', s)
    window.history.replaceState({}, '', url.toString())
  }

  // 空结果时加载推荐内容(获取最近发布的文章)
  useEffect(() => {
    // 仅在搜索完成、无结果、非加载中、有查询词时加载推荐
    if (searched && !loading && results.length === 0 && query.trim()) {
      let cancelled = false
      setLoadingRecommendations(true)
      fetch('/api/posts/public')
        .then(res => res.json())
        .then((data: RecommendPost[]) => {
          if (cancelled) return
          if (Array.isArray(data)) {
            // 取前 4 条作为推荐
            setRecommendations(data.slice(0, 4))
          } else {
            setRecommendations([])
          }
        })
        .catch(() => {
          if (!cancelled) setRecommendations([])
        })
        .finally(() => {
          if (!cancelled) setLoadingRecommendations(false)
        })
      return () => {
        cancelled = true
      }
    } else if (results.length > 0) {
      // 有结果时清空推荐
      setRecommendations([])
    }
  }, [searched, loading, results.length, query])

  // 按类型筛选
  const filtered = activeType === 'all' ? results : results.filter(r => r.type === activeType)

  // 各类型计数
  const counts = {
    all: results.length,
    post: results.filter(r => r.type === 'post').length,
    skill: results.filter(r => r.type === 'skill').length,
    gallery: results.filter(r => r.type === 'gallery').length,
  }

  const tabs: Array<{ key: 'all' | 'post' | 'skill' | 'gallery'; label: string; count: number }> = [
    { key: 'all', label: '全部', count: counts.all },
    { key: 'post', label: '博客', count: counts.post },
    { key: 'skill', label: 'Skills', count: counts.skill },
    { key: 'gallery', label: '画廊', count: counts.gallery },
  ]

  // 当前用于高亮的关键词
  const highlightTerm = query.trim()

  return (
    <div className="max-w-6xl mx-auto px-6 py-24">
      {/* 标题 */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-900 tracking-tight mb-2">搜索</h1>
        <p className="text-sm text-gray-500">在博客、Skills、画廊中搜索内容</p>
      </div>

      {/* 搜索框 */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 z-10" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => handleInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
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
                onMouseDown={handleHistoryClear}
                className="text-xs text-gray-400 hover:text-red-500 transition-colors"
              >
                清除历史
              </button>
            </div>
            <ul className="max-h-80 overflow-y-auto">
              {history.map((item) => (
                <li key={item}>
                  <div
                    onMouseDown={(e) => { e.preventDefault(); handleHistoryClick(item) }}
                    className="flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 cursor-pointer group"
                  >
                    <span className="flex items-center gap-2 text-sm text-gray-700 truncate">
                      <Clock className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
                      {item}
                    </span>
                    <button
                      onMouseDown={(e) => handleHistoryRemove(e, item)}
                      className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full text-gray-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
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

      {/* 加载中 */}
      {loading && (
        <div className="flex items-center justify-center py-12 gap-2 text-gray-400">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">搜索中…</span>
        </div>
      )}

      {/* 结果 */}
      {!loading && searched && (
        <>
          {/* 分类 Tab */}
          {results.length > 0 && (
            <div className="flex items-center gap-2 mb-6 border-b border-gray-100 pb-3">
              {tabs.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveType(tab.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activeType === tab.key
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  {tab.label}
                  <span className={`ml-1.5 ${activeType === tab.key ? 'text-gray-300' : 'text-gray-400'}`}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* 空结果 + 推荐 */}
          {results.length === 0 && (
            <div className="flex flex-col items-center py-10 gap-3 text-gray-400">
              <Search className="w-12 h-12 opacity-30" />
              <p className="text-sm">没有找到与「{query}」相关的内容</p>
              <p className="text-xs text-gray-300">试试其他关键词,或看看下面的热门内容</p>

              {/* 推荐内容 */}
              <div className="w-full mt-6">
                <div className="flex items-center gap-2 mb-4 justify-center">
                  <TrendingUp className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-bold text-gray-600">未找到相关结果,试试这些热门内容</span>
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
              </div>
            </div>
          )}

          {/* 结果列表 */}
          {filtered.length > 0 && (
            <div className="space-y-3">
              {filtered.map((r, i) => {
                const meta = TYPE_META[r.type]
                const Icon = meta.icon
                return (
                  <Link
                    key={`${r.type}-${r.id}-${i}`}
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
                        <h3
                          className="text-sm font-bold text-gray-900 truncate group-hover:text-blue-600 transition-colors mb-1"
                          dangerouslySetInnerHTML={{ __html: highlightKeyword(r.title, highlightTerm) }}
                        />
                        {r.excerpt && (
                          <p
                            className="text-xs text-gray-500 line-clamp-2"
                            dangerouslySetInnerHTML={{ __html: highlightKeyword(r.excerpt, highlightTerm) }}
                          />
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
        </>
      )}

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
