'use client'

import Image from 'next/image'
import { createPortal } from 'react-dom'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Film, Heart, LayoutGrid, Search, X } from 'lucide-react'
import FilmStrip from '@/components/sections/FilmStrip'
import Lightbox from './Lightbox'
import MasonryGrid from './MasonryGrid'
import type { GalleryItem, GalleryView } from './types'

const VIEW_KEY = 'gallery_view'
const LIKED_KEY = 'gallery_liked_ids'

function padIndex(index: number) {
  return String(index + 1).padStart(2, '0')
}

function storedLikedIds() {
  try {
    return new Set(JSON.parse(localStorage.getItem(LIKED_KEY) || '[]') as number[])
  } catch {
    return new Set<number>()
  }
}

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
    const counts = new Map<string, number>()
    images.forEach(image => counts.set(image.category, (counts.get(image.category) ?? 0) + 1))
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1])
  }, [images])

  const initialId = initialImageId && images.some(image => image.id === initialImageId)
    ? initialImageId
    : images[0]?.id ?? null

  const [view, setView] = useState<GalleryView>('masonry')
  const [category, setCategory] = useState('ALL')
  const [tag, setTag] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [activeId, setActiveId] = useState<number | null>(initialId)
  const [likedIds, setLikedIds] = useState<Set<number>>(new Set())
  const [lightboxId, setLightboxId] = useState<number | null>(initialImageId ? initialId : null)

  useEffect(() => {
    const saved = localStorage.getItem(VIEW_KEY)
    if (saved === 'film' || saved === 'masonry') setView(saved)
    setLikedIds(storedLikedIds())
  }, [])

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    return images.filter(image => {
      if (category !== 'ALL' && image.category !== category) return false
      if (tag && !image.tags.includes(tag)) return false
      if (!normalizedQuery) return true
      return (
        image.title.toLowerCase().includes(normalizedQuery) ||
        (image.description ?? '').toLowerCase().includes(normalizedQuery) ||
        image.category.toLowerCase().includes(normalizedQuery) ||
        image.tags.some(item => item.toLowerCase().includes(normalizedQuery))
      )
    })
  }, [images, category, tag, query])

  const visibleActiveId = filtered.some(image => image.id === activeId)
    ? activeId
    : filtered[0]?.id ?? null
  const activeIndex = visibleActiveId === null
    ? -1
    : filtered.findIndex(image => image.id === visibleActiveId)
  const activeImage = activeIndex >= 0 ? filtered[activeIndex] : null
  const previousImage = filtered.length > 1
    ? filtered[(activeIndex - 1 + filtered.length) % filtered.length]
    : null
  const nextImage = filtered.length > 1
    ? filtered[(activeIndex + 1) % filtered.length]
    : null
  const hasFilter = category !== 'ALL' || tag !== null || query.trim() !== ''

  const selectRelative = useCallback((delta: number) => {
    if (filtered.length < 2 || activeIndex < 0) return
    const nextIndex = (activeIndex + delta + filtered.length) % filtered.length
    setActiveId(filtered[nextIndex].id)
  }, [activeIndex, filtered])

  useEffect(() => {
    if (lightboxId !== null) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') selectRelative(-1)
      if (event.key === 'ArrowRight') selectRelative(1)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [lightboxId, selectRelative])

  const switchView = (nextView: GalleryView) => {
    setView(nextView)
    localStorage.setItem(VIEW_KEY, nextView)
    requestAnimationFrame(() => {
      document.getElementById('gallery-archive')?.scrollIntoView({ behavior: 'smooth' })
    })
  }

  const syncUrl = (id: number | null) => {
    const url = new URL(window.location.href)
    if (id === null) url.searchParams.delete('image')
    else url.searchParams.set('image', String(id))
    window.history.replaceState(null, '', url.toString())
  }

  const openLightbox = (id: number) => {
    setActiveId(id)
    setLightboxId(id)
    syncUrl(id)
  }

  const closeLightbox = () => {
    setLightboxId(null)
    syncUrl(null)
  }

  const clearFilters = () => {
    setCategory('ALL')
    setTag(null)
    setQuery('')
  }

  const likeActiveImage = async () => {
    if (!activeImage || likedIds.has(activeImage.id)) return
    const nextLikedIds = new Set(likedIds).add(activeImage.id)
    setLikedIds(nextLikedIds)
    localStorage.setItem(LIKED_KEY, JSON.stringify(Array.from(nextLikedIds)))
    try {
      await fetch(`/api/gallery/${activeImage.id}/like`, { method: 'POST' })
    } catch {
      // 点赞采用乐观更新，网络失败不打断浏览。
    }
  }

  return (
    <div className="bg-[#0a0b0d]">
      <section className="relative min-h-[100svh] overflow-hidden text-white">
        {activeImage ? (
          <>
            <Image
              key={activeImage.id}
              src={activeImage.url}
              alt=""
              fill
              priority
              sizes="100vw"
              className="gallery-hero-image object-cover object-[72%_center] sm:object-[58%_center]"
            />
            <button
              type="button"
              onClick={() => openLightbox(activeImage.id)}
              className="absolute inset-0 z-[1] cursor-zoom-in"
              aria-label={`查看 ${activeImage.title}`}
            />
          </>
        ) : (
          <div className="absolute inset-0 bg-[#15171b]" />
        )}

        <div className="pointer-events-none absolute inset-0 z-[2] bg-black/5" />
        <div className="pointer-events-none absolute inset-0 z-[2] bg-gradient-to-b from-black/40 via-black/0 to-black/55" />
        <div className="pointer-events-none absolute inset-0 z-[2] bg-gradient-to-r from-black/30 via-transparent to-black/10" />

        <div className="pointer-events-none absolute inset-0 z-10">
          <header className="absolute left-6 top-24 max-w-[34rem] sm:left-10 sm:top-[17%] lg:left-[5.5vw]">
            <h1 className="text-[clamp(2.8rem,5vw,4.25rem)] font-black leading-none tracking-[-0.06em] text-white drop-shadow-sm">
              视觉存档<span className="text-blue-500">.</span>
            </h1>
            <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.48em] text-white/80 sm:text-[11px]">
              Visual Archive · {filtered.length || images.length} Works
            </p>

            {activeImage ? (
              <div className="mt-10 sm:mt-16" aria-live="polite">
                <span className="mb-5 block h-px w-4 bg-white/80" />
                <h2 className="max-w-sm text-xl font-semibold tracking-wide text-white sm:text-2xl">
                  {activeImage.title}
                </h2>
                <p className="mt-2 text-sm font-semibold text-blue-500">{activeImage.category}</p>
                <button
                  type="button"
                  onClick={likeActiveImage}
                  aria-label={likedIds.has(activeImage.id) ? '已点赞' : '点赞'}
                  aria-pressed={likedIds.has(activeImage.id)}
                  className="pointer-events-auto mt-5 inline-flex items-center gap-2 text-sm text-white/85 transition-colors hover:text-white"
                >
                  <Heart className={`h-5 w-5 ${likedIds.has(activeImage.id) ? 'fill-blue-500 text-blue-500' : ''}`} />
                  {activeImage.likes + (likedIds.has(activeImage.id) ? 1 : 0)}
                </button>
              </div>
            ) : (
              <div className="pointer-events-auto mt-12 max-w-sm">
                <p className="text-lg font-bold text-white">没有匹配的图片</p>
                {hasFilter ? (
                  <button type="button" onClick={clearFilters} className="mt-4 text-sm font-bold text-blue-400 hover:text-blue-300">
                    清除筛选条件
                  </button>
                ) : null}
              </div>
            )}
          </header>

          {filtered.length > 1 ? (
            <nav
              className="pointer-events-auto absolute right-4 top-1/2 hidden -translate-y-1/2 flex-col sm:flex lg:right-7"
              aria-label="作品导航"
            >
              {filtered.map((image, index) => {
                const active = image.id === visibleActiveId
                return (
                  <button
                    key={image.id}
                    type="button"
                    onClick={() => setActiveId(image.id)}
                    aria-label={`切换到作品 ${index + 1}：${image.title}`}
                    aria-current={active ? 'true' : undefined}
                    className={`h-11 border-l-2 pl-4 pr-1 font-mono text-xs transition-all ${
                      active
                        ? 'border-blue-500 text-white'
                        : 'border-white/15 text-white/45 hover:border-white/40 hover:text-white/80'
                    }`}
                  >
                    {padIndex(index)}
                  </button>
                )
              })}
            </nav>
          ) : null}

          {previousImage && nextImage ? (
            <>
              <button
                type="button"
                onClick={() => selectRelative(-1)}
                className="pointer-events-auto absolute bottom-[152px] left-6 hidden items-center gap-4 md:flex lg:left-[4vw]"
                aria-label={`上一张：${previousImage.title}`}
              >
                <ChevronLeft className="h-6 w-6 text-white/90" />
                <span className="relative block h-[116px] w-[220px] overflow-hidden rounded-2xl border border-white/10 shadow-2xl shadow-black/40 lg:h-[136px] lg:w-[264px]">
                  <Image src={previousImage.url} alt="" fill sizes="264px" className="object-cover transition-transform duration-500 hover:scale-105" />
                </span>
              </button>
              <button
                type="button"
                onClick={() => selectRelative(1)}
                className="pointer-events-auto absolute bottom-[152px] right-6 hidden items-center gap-4 md:flex lg:right-[4vw]"
                aria-label={`下一张：${nextImage.title}`}
              >
                <span className="relative block h-[116px] w-[220px] overflow-hidden rounded-2xl border border-white/10 shadow-2xl shadow-black/40 lg:h-[136px] lg:w-[264px]">
                  <Image src={nextImage.url} alt="" fill sizes="264px" className="object-cover transition-transform duration-500 hover:scale-105" />
                </span>
                <ChevronRight className="h-6 w-6 text-white/90" />
              </button>
            </>
          ) : null}
        </div>

        <div className="absolute inset-x-4 bottom-4 z-20 rounded-[1.75rem] border border-white/10 bg-black/75 p-3 shadow-2xl shadow-black/40 backdrop-blur-2xl sm:inset-x-8 sm:bottom-10 lg:inset-x-[4vw] lg:grid lg:min-h-[68px] lg:grid-cols-[minmax(260px,1fr)_auto_auto] lg:items-center lg:gap-6 lg:rounded-full lg:px-6 lg:py-2">
          <label className="flex min-w-0 items-center gap-3 text-white/75">
            <Search className="h-4 w-4 shrink-0" />
            <span className="hidden text-sm font-semibold xl:inline">搜索</span>
            <input
              value={query}
              onChange={event => setQuery(event.target.value)}
              placeholder="搜索作品、描述、标签…"
              className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/35"
            />
            {query ? (
              <button type="button" onClick={() => setQuery('')} aria-label="清空搜索" className="text-white/45 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </label>

          <div className="mt-3 flex items-center justify-center gap-1 border-y border-white/10 py-2 lg:mt-0 lg:border-x lg:border-y-0 lg:px-6 lg:py-0">
            <button
              type="button"
              onClick={() => setCategory('ALL')}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${category === 'ALL' ? 'bg-white/10 text-white' : 'text-white/45 hover:text-white'}`}
            >
              全部
            </button>
            {categories.map(([item]) => (
              <button
                key={item}
                type="button"
                onClick={() => setCategory(item)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${category === item ? 'text-blue-500' : 'text-white/45 hover:text-white'}`}
              >
                {item}
              </button>
            ))}
          </div>

          <div className="mt-2 flex items-center justify-center gap-2 lg:mt-0 lg:justify-end">
            <button
              type="button"
              onClick={() => switchView('masonry')}
              className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition-colors ${view === 'masonry' ? 'border-white/25 bg-white/5 text-white' : 'border-transparent text-white/45 hover:text-white'}`}
            >
              <LayoutGrid className="h-4 w-4" /> 瀑布流
            </button>
            <button
              type="button"
              onClick={() => switchView('film')}
              className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition-colors ${view === 'film' ? 'border-white/25 bg-white/5 text-white' : 'border-transparent text-white/45 hover:text-white'}`}
            >
              <Film className="h-4 w-4" /> 胶片带
            </button>
          </div>
        </div>
      </section>

      <section id="gallery-archive" className="min-h-screen bg-[#fafaf8] px-4 py-20 text-gray-900 sm:px-6 lg:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 flex flex-col gap-6 border-b border-gray-200 pb-8 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-blue-600">Archive Index</p>
              <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
                {view === 'masonry' ? '瀑布流' : '胶片带'}
              </h2>
            </div>
            <p className="font-mono text-xs text-gray-400">{filtered.length} / {images.length} WORKS</p>
          </div>

          {topTags.length > 0 ? (
            <div className="mb-8 flex flex-wrap gap-2">
              {topTags.slice(0, 12).map(({ tag: item, count }) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setTag(current => current === item ? null : item)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-bold transition-colors ${
                    tag === item
                      ? 'border-blue-600 bg-blue-600 text-white'
                      : 'border-gray-200 bg-white text-gray-500 hover:border-gray-400 hover:text-gray-900'
                  }`}
                >
                  #{item} <span className="opacity-60">{count}</span>
                </button>
              ))}
              {hasFilter ? (
                <button type="button" onClick={clearFilters} className="px-3 py-1.5 text-xs font-bold text-blue-600 hover:text-blue-700">
                  清除筛选
                </button>
              ) : null}
            </div>
          ) : null}

          {filtered.length === 0 ? (
            <div className="py-28 text-center">
              <p className="text-lg font-bold text-gray-300">没有匹配的图片</p>
              {hasFilter ? (
                <button type="button" onClick={clearFilters} className="mt-4 text-sm font-bold text-blue-600">
                  清除筛选条件
                </button>
              ) : null}
            </div>
          ) : view === 'masonry' ? (
            <MasonryGrid key={`${category}-${tag}-${query}`} images={filtered} onOpen={openLightbox} />
          ) : (
            <FilmStrip key={`${category}-${tag}-${query}`} images={filtered} onOpen={openLightbox} />
          )}
        </div>
      </section>

      {lightboxId !== null ? createPortal(
        <Lightbox
          images={filtered}
          currentId={lightboxId}
          onClose={closeLightbox}
          onNavigate={openLightbox}
        />,
        document.body
      ) : null}
    </div>
  )
}
