'use client'

// app/skills/SkillList.tsx — 技能卡片网格 + 筛选 + 排序 + 搜索 + 分页
import { useState, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, X, Tag, ArrowUpDown, ChevronLeft, ChevronRight, Star, Filter } from 'lucide-react'
import SectionHeading from '@/components/ui/SectionHeading'
import SkillCard from '@/components/sections/SkillCard'

interface SkillMeta {
  slug: string
  name: string
  description: string | null
  chinese_summary: string | null
  source_type: string
  stars: number
  tags: string[]
  category: string
  cover_image: string | null
  created_at: string
  updated_at: string
}

interface SkillListProps {
  skills: SkillMeta[]
  total: number
  page: number
  pageSize: number
  categories: { category: string; count: number }[]
}

type SortKey = 'updated_at' | 'stars' | 'created_at'

const SOURCE_TYPES = [
  { value: 'all', label: '全部来源' },
  { value: 'github', label: 'GitHub' },
  { value: 'reddit', label: 'Reddit' },
  { value: 'hn', label: 'Hacker News' },
  { value: 'ph', label: 'Product Hunt' },
]

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'updated_at', label: '最近更新' },
  { value: 'stars', label: '最多 Stars' },
  { value: 'created_at', label: '最新收录' },
]

export default function SkillList({ skills, total, page, pageSize, categories }: SkillListProps) {
  const [query, setQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [activeSource, setActiveSource] = useState<string>('all')
  const [sort, setSort] = useState<SortKey>('stars')
  const router = useRouter()
  const searchParams = useSearchParams()
  const totalPages = Math.ceil(total / pageSize)

  // 客户端筛选 + 排序
  const processed = useMemo(() => {
    let list = [...skills]

    // 搜索
    const q = query.trim().toLowerCase()
    if (q) {
      list = list.filter(s =>
        s.name.toLowerCase().includes(q) ||
        s.description?.toLowerCase().includes(q) ||
        s.tags?.some(t => t.toLowerCase().includes(q))
      )
    }

    // 分类筛选
    if (activeCategory) {
      list = list.filter(s => s.category === activeCategory)
    }

    // 来源筛选
    if (activeSource !== 'all') {
      list = list.filter(s => s.source_type === activeSource)
    }

    // 排序
    if (sort === 'stars') {
      list.sort((a, b) => b.stars - a.stars)
    } else if (sort === 'created_at') {
      list.sort((a, b) => b.created_at.localeCompare(a.created_at))
    } else {
      list.sort((a, b) => b.updated_at.localeCompare(a.updated_at))
    }

    return list
  }, [query, skills, activeCategory, activeSource, sort])

  const goToPage = (p: number) => {
    const params = new URLSearchParams(searchParams.toString())
    if (p <= 1) params.delete('page')
    else params.set('page', String(p))
    router.push(`/skills${params.toString() ? '?' + params.toString() : ''}`)
  }

  const isFiltering = query.trim().length > 0 || activeCategory !== null || activeSource !== 'all'

  return (
    <div>
      <SectionHeading>AI Skills</SectionHeading>

      {/* 搜索框 */}
      <div className="relative mb-6 mt-2">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="搜索技能名称、描述或标签…"
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

      {/* 分类筛选 */}
      <div className="flex items-center gap-1.5 flex-wrap mb-4">
        <Tag className="w-3.5 h-3.5 text-gray-300 mr-1" />
        {activeCategory && (
          <button
            onClick={() => setActiveCategory(null)}
            className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"
          >
            全部分类
          </button>
        )}
        {categories.map(cat => (
          <button
            key={cat.category}
            onClick={() => setActiveCategory(activeCategory === cat.category ? null : cat.category)}
            className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest transition-all duration-200 ${
              activeCategory === cat.category
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-gray-50 text-gray-400 border border-gray-100 hover:border-blue-300 hover:text-blue-600'
            }`}
          >
            {cat.category} ({cat.count})
          </button>
        ))}
      </div>

      {/* 来源筛选 + 排序 */}
      <div className="flex items-center justify-between gap-4 mb-8 flex-wrap">
        <div className="flex items-center gap-1.5">
          <Filter className="w-3.5 h-3.5 text-gray-300" />
          {SOURCE_TYPES.map(st => (
            <button
              key={st.value}
              onClick={() => setActiveSource(st.value)}
              className={`text-[10px] font-bold px-2.5 py-1 rounded-full transition-all duration-200 ${
                activeSource === st.value
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-50 text-gray-400 border border-gray-100 hover:border-gray-300 hover:text-gray-600'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1">
          <ArrowUpDown className="w-3.5 h-3.5 text-gray-300" />
          {SORT_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setSort(opt.value)}
              className={`text-xs font-medium px-2 py-1 rounded-lg transition-colors ${
                sort === opt.value ? 'text-blue-600 bg-blue-50' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* 搜索结果提示 */}
      {isFiltering && (
        <p className="text-xs text-gray-400 font-mono mb-6 -mt-4">
          {processed.length > 0
            ? `找到 ${processed.length} 个技能`
            : '没有匹配的技能'}
        </p>
      )}

      {/* 空态 */}
      {processed.length === 0 && !isFiltering && (
        <div className="flex flex-col items-center py-20 gap-3 text-gray-400">
          <Star className="w-10 h-10 opacity-30" />
          <p className="text-sm">还没有技能数据，等待每日爬取…</p>
        </div>
      )}

      {processed.length === 0 && isFiltering && (
        <div className="flex flex-col items-center py-20 gap-3 text-gray-400">
          <Search className="w-10 h-10 opacity-30" />
          <p className="text-sm">没有找到匹配的技能</p>
          <button
            onClick={() => { setQuery(''); setActiveCategory(null); setActiveSource('all') }}
            className="text-xs text-blue-500 hover:underline mt-1"
          >
            清空筛选
          </button>
        </div>
      )}

      {/* 卡片网格 */}
      {processed.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {processed.map((skill, i) => (
            <SkillCard key={skill.slug} skill={skill} index={i} />
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
