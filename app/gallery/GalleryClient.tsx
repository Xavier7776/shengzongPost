'use client'

// app/gallery/GalleryClient.tsx
// 图库编排层：视图切换（瀑布流/胶片带）、搜索、分类、标签筛选、灯箱与 URL 同步

import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { LayoutGrid, Film, Search, X } from 'lucide-react'
import MasonryGrid from './MasonryGrid'
import Lightbox from './Lightbox'
import FilmStrip from '@/components/sections/FilmStrip'
import type { GalleryItem, GalleryView } from './types'

const VIEW_KEY = 'gallery_view'

export default function GalleryClient({
  images,
  tags: topTags,
  initialImageId,
}: {
  images: GalleryItem[]
  tags: { tag: string; count: number }[]
  initialImageId: number | null
}) {
  const categories = useMemo(() => {
    const count: Record<string, number> = {}
    images.forEach(img => { count[img.category] = (count[img.category] ?? 0) + 1 })
    return Object.entries(count).sort((a, b) => b[1] - a[1]).map(([cat]) => cat)
  }, [images])

  const [view, setView] = useState<GalleryView>('masonry')
  const [category, setCategory] = useState<string>('ALL')
  const [tag, setTag] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [lightboxId, setLightboxId] = useState<number | null>(
    initialImageId && images.some(i => i.id === initialImageId) ? initialImageId : null
  )

  // 视图记忆
  useEffect(() => {
    const saved = localStorage.getItem(VIEW_KEY)
    if (saved === 'film' || saved === 'masonry') setView(saved)
  }, [])
  const switchView = (v: GalleryView) => {
    setView(v)
    localStorage.setItem(VIEW_KEY, v)
  }

  // 筛选
  const filtered = useMemo(() => {
    let list = category === 'ALL' ? images : images.filter(i => i.category === category)
    if (tag) list = list.filter(i => i.tags.includes(tag))
    if (query.trim()) {
      const q = query.trim().toLowerCase()
      list = list.filter(
        i =>
          i.title.toLowerCase().includes(q) ||
          (i.description ?? '').toLowerCase().includes(q) ||
          i.category.toLowerCase().includes(q) ||
          i.tags.some(t => t.toLowerCase().includes(q))
      )
    }
    return list
  }, [images, category, tag, query])

  const hasFilter = category !== 'ALL' || tag !== null || query.trim() !== ''

  // Lightbox URL 同步：?image=id
  const syncUrl = (id: number | null) => {
    const url = new URL(window.location.href)
    if (id === null) url.searchParams.delete('image')
    else url.searchParams.set('image', String(id))
    window.history.replaceState(null, '', url.toString())
  }
  const openLightbox = (id: number) => { setLightboxId(id); syncUrl(id) }
  const closeLightbox = () => { setLightboxId(null); syncUrl(null) }

  return (
    <div className="animate-in">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-16 md:py-24">

        {/* ── Header ── */}
        <header className="mb-10 md:mb-14">
          <p className="font-mono text-[10px] tracking-[0.45em] uppercase mb-3 text-blue-600">
            Visual Archive · {images.length} works
          </p>
          <h1 className="text-5xl md:text-6xl font-black tracking-tighter text-gray-900">
            视觉存档<span className="text-blue-600">.</span>
          </h1>
        </header>

        {/* ── 工具栏 ── */}
        <div className="mb-8 space-y-4">
          {/* 第一行：搜索 + 视图切换 */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="搜索标题、描述、标签…"
                className="w-full pl-10 pr-9 py-2.5 rounded-full bg-white border border-gray-200 text-sm font-medium text-gray-900 placeholder:text-gray-300 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all"
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  aria-label="清空搜索"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-1 p-1 rounded-full bg-gray-100 ml-auto">
              <ViewBtn active={view === 'masonry'} onClick={() => switchView('masonry')}>
                <LayoutGrid className="w-3.5 h-3.5" /> 瀑布流
              </ViewBtn>
              <ViewBtn active={view === 'film'} onClick={() => switchView('film')}>
                <Film className="w-3.5 h-3.5" /> 胶片带
              </ViewBtn>
            </div>
          </div>

          {/* 第二行：分类 tabs */}
          <div className="flex items-center gap-2 flex-wrap">
            <Chip active={category === 'ALL'} onClick={() => setCategory('ALL')}>
              ALL <span className="opacity-60 font-mono text-[9px]">{images.length}</span>
            </Chip>
            <div className="w-px h-5 bg-gray-200 mx-0.5" />
            {categories.map(cat => (
              <Chip key={cat} active={category === cat} onClick={() => setCategory(cat)}>
                {cat}{' '}
                <span className="opacity-60 font-mono text-[9px]">
                  {images.filter(i => i.category === cat).length}
                </span>
              </Chip>
            ))}
          </div>

          {/* 第三行：热门标签 */}
          {topTags.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              {topTags.slice(0, 12).map(({ tag: t, count }) => (
                <button
                  key={t}
                  onClick={() => setTag(prev => (prev === t ? null : t))}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-all ${
                    tag === t
                      ? 'bg-blue-600 text-white'
                      : 'bg-white border border-gray-200 text-gray-400 hover:border-blue-300 hover:text-blue-500'
                  }`}
                >
                  #{t}<span className="ml-1 opacity-60">{count}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── 内容区 ── */}
        {images.length === 0 || filtered.length === 0 ? (
          <div className="text-center py-32 space-y-2">
            <p className="text-lg font-bold text-gray-300">没有匹配的图片</p>
            {hasFilter && (
              <button
                onClick={() => { setCategory('ALL'); setTag(null); setQuery('') }}
                className="mt-2 px-4 py-2 rounded-full text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors"
              >
                清除筛选条件
              </button>
            )}
          </div>
        ) : view === 'masonry' ? (
          <div key={`${category}-${tag}-${query}`} className="animate-masonry-in">
            <MasonryGrid images={filtered} onOpen={openLightbox} />
          </div>
        ) : (
          <FilmStrip key={`${category}-${tag}-${query}`} images={filtered} onOpen={openLightbox} />
        )}
      </div>

      {/* ── 灯箱：Portal 挂到 body，避免祖先 transform 影响 fixed 定位 ── */}
      {lightboxId !== null && createPortal(
        <Lightbox
          images={filtered}
          currentId={lightboxId}
          onClose={closeLightbox}
          onNavigate={openLightbox}
        />,
        document.body
      )}
    </div>
  )
}

// ── 小组件 ────────────────────────────────────────────────────────────────────
function Chip({ active, children, onClick }: {
  active: boolean
  children: React.ReactNode
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest transition-all duration-300 ${
        active
          ? 'bg-gray-900 text-white'
          : 'bg-white border border-gray-200 text-gray-400 hover:border-gray-400 hover:text-gray-600'
      }`}
    >
      {children}
    </button>
  )
}

function ViewBtn({ active, children, onClick }: {
  active: boolean
  children: React.ReactNode
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-300 ${
        active ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400 hover:text-gray-600'
      }`}
    >
      {children}
    </button>
  )
}
