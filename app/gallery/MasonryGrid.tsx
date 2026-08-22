'use client'

// app/gallery/MasonryGrid.tsx
// 瀑布流主视图：按最短列均衡分配，模糊占位渐入，筛选切换时交错入场

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import { Heart } from 'lucide-react'
import { blurPlaceholder, ratioOf, type GalleryItem } from './types'

const GAP = 20

function useColumns() {
  const [cols, setCols] = useState(3)

  useEffect(() => {
    const compute = () => {
      const w = window.innerWidth
      setCols(w < 640 ? 2 : w < 1024 ? 3 : 4)
    }
    compute()
    window.addEventListener('resize', compute)
    return () => window.removeEventListener('resize', compute)
  }, [])

  return cols
}

// ── 单个卡片 ──────────────────────────────────────────────────────────────────
function MasonryCard({
  img,
  index,
  onOpen,
  onMeasured,
}: {
  img: GalleryItem
  index: number
  onOpen: (id: number) => void
  onMeasured: (id: number, w: number, h: number) => void
}) {
  const [loaded, setLoaded] = useState(false)
  const [liked, setLiked] = useState(false)
  const likedRef = useRef(false)

  const handleLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    if (!img.width || !img.height) {
      onMeasured(img.id, e.currentTarget.naturalWidth, e.currentTarget.naturalHeight)
    }
    requestAnimationFrame(() => setLoaded(true))
  }

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (likedRef.current) return
    likedRef.current = true
    setLiked(true)
    try {
      await fetch(`/api/gallery/${img.id}/like`, { method: 'POST' })
    } catch {
      likedRef.current = false
      setLiked(false)
    }
  }

  return (
    <figure
      className="group relative cursor-pointer overflow-hidden rounded-2xl bg-gray-100 animate-masonry-in"
      style={{ animationDelay: `${Math.min(index * 40, 600)}ms` }}
      onClick={() => onOpen(img.id)}
    >
      {/* 模糊占位层 */}
      <div
        className="absolute inset-0 transition-opacity duration-700"
        style={{
          opacity: loaded ? 0 : 1,
          backgroundImage: `url("${blurPlaceholder(img.url)}")`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'blur(2px)',
        }}
      />

      {/* next/image 优化：自动 AVIF/WebP + 响应式尺寸 */}
      <Image
        src={img.url}
        alt={img.title}
        width={img.width || 800}
        height={img.height || Math.round(800 / ratioOf(img))}
        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        loading="lazy"
        onLoad={handleLoad}
        className="w-full h-auto object-cover transition-all duration-700 group-hover:scale-[1.03]"
        style={{
          aspectRatio: `${ratioOf(img)}`,
          opacity: loaded ? 1 : 0,
        }}
      />

      {/* hover 信息层 */}
      <div
        className="absolute inset-0 flex flex-col justify-end p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ background: 'linear-gradient(to top, rgba(10,10,12,0.72) 0%, transparent 55%)' }}
      >
        <p className="text-white font-bold text-sm truncate translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
          {img.title || '无标题'}
        </p>
        <div className="flex items-center gap-2 mt-1 translate-y-2 group-hover:translate-y-0 transition-transform duration-300 delay-75">
          <span className="text-[9px] font-black uppercase tracking-widest text-white/50">
            {img.category}
          </span>
          <span className="flex items-center gap-1 text-[11px] font-bold text-[#c8a97e]">
            <Heart className={`w-3 h-3 ${liked ? 'fill-current' : ''}`} />
            {img.likes + (liked ? 1 : 0)}
          </span>
        </div>
      </div>

      {/* 快捷点赞（移动端可见） */}
      <button
        aria-label="点赞"
        onClick={handleLike}
        className={`md:hidden absolute top-2.5 right-2.5 flex items-center gap-1 px-2 py-1 rounded-full backdrop-blur-md bg-black/30 text-[11px] font-bold ${
          liked ? 'text-red-400' : 'text-white'
        }`}
      >
        <Heart className={`w-3 h-3 ${liked ? 'fill-current' : ''}`} />
        {img.likes + (liked ? 1 : 0)}
      </button>

      {/* 精选角标 */}
      {index === 0 && (
        <span className="absolute top-3 left-3 text-[9px] font-black uppercase tracking-[0.25em] text-blue-600 bg-white/90 backdrop-blur px-2 py-1 rounded-full">
          Featured
        </span>
      )}
    </figure>
  )
}

// ── 瀑布流主体 ────────────────────────────────────────────────────────────────
const BATCH = 24 // 首批渲染数与每次增量：避免大图库一次性渲染全部节点

export default function MasonryGrid({
  images,
  onOpen,
}: {
  images: GalleryItem[]
  onOpen: (id: number) => void
}) {
  const cols = useColumns()
  const [visibleCount, setVisibleCount] = useState(BATCH)
  const sentinelRef = useRef<HTMLDivElement>(null)

  // 触底渐进加载
  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisibleCount(c => (c >= images.length ? c : c + BATCH))
        }
      },
      { rootMargin: '600px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [images.length])

  useEffect(() => { setVisibleCount(BATCH) }, [images])

  // 尺寸回填：旧数据加载后更新比例，触发重排
  const [dims, setDims] = useState<Record<number, { w: number; h: number }>>({})
  const onMeasured = useCallback((id: number, w: number, h: number) => {
    setDims(prev => (prev[id] ? prev : { ...prev, [id]: { w, h } }))
  }, [])

  const enriched = useMemo(
    () =>
      images.slice(0, visibleCount).map(img =>
        dims[img.id] ? { ...img, width: dims[img.id].w, height: dims[img.id].h } : img
      ),
    [images, dims, visibleCount]
  )

  // 均衡分配：始终放入当前最短的列
  const columns = useMemo(() => {
    const buckets: GalleryItem[][] = Array.from({ length: cols }, () => [])
    const heights = new Array(cols).fill(0)
    for (const img of enriched) {
      let min = 0
      for (let i = 1; i < cols; i++) if (heights[i] < heights[min]) min = i
      buckets[min].push(img)
      heights[min] += 1 / ratioOf(img)
    }
    return buckets
  }, [enriched, cols])

  return (
    <>
      <div className="flex" style={{ gap: GAP }}>
        {columns.map((bucket, ci) => (
          <div key={ci} className="flex-1 min-w-0 flex flex-col" style={{ gap: GAP }}>
            {bucket.map((img, i) => (
              <MasonryCard
                key={img.id}
                img={img}
                index={ci + i * cols}
                onOpen={onOpen}
                onMeasured={onMeasured}
              />
            ))}
          </div>
        ))}
      </div>
      {/* 触底哨兵：进入视口前 600px 即预载下一批 */}
      {visibleCount < images.length && (
        <div ref={sentinelRef} className="py-10 text-center text-xs font-bold text-gray-300">
          继续下滑加载更多…
        </div>
      )}
    </>
  )
}
