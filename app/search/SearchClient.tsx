'use client'
// app/search/SearchClient.tsx
// 全站搜索客户端组件：搜索框 + 分类 Tab + 结果列表
import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Search, Loader2, FileText, Code2, Image as ImageIcon, X } from 'lucide-react'
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

export default function SearchClient({ initialQuery }: { initialQuery: string }) {
  const [query, setQuery] = useState(initialQuery)
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [activeType, setActiveType] = useState<'all' | 'post' | 'skill' | 'gallery'>('all')
  const [searched, setSearched] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  // 执行搜索
  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([])
      setSearched(false)
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
    }
    inputRef.current?.focus()
  }, [initialQuery, doSearch])

  // 防抖搜索
  const handleInput = (value: string) => {
    setQuery(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      doSearch(value)
      // 同步 URL（不触发导航）
      const url = new URL(window.location.href)
      if (value) {
        url.searchParams.set('q', value)
      } else {
        url.searchParams.delete('q')
      }
      window.history.replaceState({}, '', url.toString())
    }, 350)
  }

  // 清空
  const handleClear = () => {
    setQuery('')
    setResults([])
    setSearched(false)
    inputRef.current?.focus()
    const url = new URL(window.location.href)
    url.searchParams.delete('q')
    window.history.replaceState({}, '', url.toString())
  }

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

  return (
    <div className="max-w-[960px] mx-auto px-6 py-24">
      {/* 标题 */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-900 tracking-tight mb-2">搜索</h1>
        <p className="text-sm text-gray-500">在博客、Skills、画廊中搜索内容</p>
      </div>

      {/* 搜索框 */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => handleInput(e.target.value)}
          placeholder="输入关键词…"
          className="w-full pl-12 pr-12 py-4 text-base bg-white border border-gray-200 rounded-2xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
        />
        {query && (
          <button
            onClick={handleClear}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
            aria-label="清空"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
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

          {/* 空结果 */}
          {results.length === 0 && (
            <div className="flex flex-col items-center py-20 gap-3 text-gray-400">
              <Search className="w-12 h-12 opacity-30" />
              <p className="text-sm">没有找到与「{query}」相关的内容</p>
              <p className="text-xs text-gray-300">试试其他关键词</p>
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
                        <h3 className="text-sm font-bold text-gray-900 truncate group-hover:text-blue-600 transition-colors mb-1">
                          {r.title}
                        </h3>
                        {r.excerpt && (
                          <p className="text-xs text-gray-500 line-clamp-2">{r.excerpt}</p>
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

      {/* 初始状态（未搜索） */}
      {!searched && !loading && (
        <div className="flex flex-col items-center py-20 gap-4 text-gray-400">
          <Search className="w-12 h-12 opacity-30" />
          <p className="text-sm">输入关键词开始搜索</p>
          <div className="flex flex-wrap gap-2 justify-center max-w-md">
            {['Next.js', 'AI Agent', 'TypeScript', '自动化', 'Rust'].map(s => (
              <button
                key={s}
                onClick={() => handleInput(s)}
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
