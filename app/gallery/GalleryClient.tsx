'use client'

// app/gallery/GalleryClient.tsx
import { useState, useMemo } from 'react'
import FilmStrip from '@/components/sections/FilmStrip'

interface GalleryImage {
  id: number
  url: string
  category: string
  title: string
}

// 分类 tab 的元数据：如果你想自定义显示名，在这里加映射
const CATEGORY_LABELS: Record<string, string> = {
  Photo: 'Photo',
  Film: 'Film',
  Urban: 'Urban',
  Portrait: 'Portrait',
  Nature: 'Nature',
  Architecture: 'Architecture',
}

function label(cat: string) {
  return CATEGORY_LABELS[cat] ?? cat
}

export default function GalleryClient({ images }: { images: GalleryImage[] }) {
  // 从实际数据中提取所有分类，按出现频率排序
  const categories = useMemo(() => {
    const count: Record<string, number> = {}
    images.forEach(img => {
      count[img.category] = (count[img.category] ?? 0) + 1
    })
    return Object.entries(count)
      .sort((a, b) => b[1] - a[1])
      .map(([cat]) => cat)
  }, [images])

  const [active, setActive] = useState<string>('ALL')

  const filtered = useMemo(
    () => (active === 'ALL' ? images : images.filter(img => img.category === active)),
    [images, active]
  )

  return (
    <div className="animate-in">
      <div className="max-w-6xl mx-auto px-6 py-24">

        {/* ── Header ── */}
        <div className="mb-10">
          <p
            className="font-mono text-[10px] tracking-[0.45em] uppercase mb-4"
            style={{ color: 'rgba(200,169,126,0.5)' }}
          >
            Visual Archive
          </p>
          <h1
            className="text-5xl font-black tracking-tighter"
            style={{ color: '#e8e8e8' }}
          >
            视觉存档
          </h1>
          <p
            className="mt-3 text-sm font-medium"
            style={{ color: 'rgba(255,255,255,0.2)' }}
          >
            拖动或使用方向键浏览 · 点击当前帧放大
          </p>
        </div>

        {/* ── Category filter tabs ── */}
        {categories.length > 0 && (
          <div className="mb-10 flex items-center gap-2 flex-wrap">
            {/* ALL 按钮 */}
            <CategoryTab
              name="ALL"
              count={images.length}
              active={active === 'ALL'}
              onClick={() => setActive('ALL')}
            />
            {/* 分隔线 */}
            <div
              className="w-px h-5 mx-1 shrink-0"
              style={{ background: 'rgba(255,255,255,0.08)' }}
            />
            {/* 各分类 */}
            {categories.map(cat => (
              <CategoryTab
                key={cat}
                name={label(cat)}
                count={images.filter(i => i.category === cat).length}
                active={active === cat}
                onClick={() => setActive(cat)}
              />
            ))}
          </div>
        )}

        {/* ── Film strip or empty state ── */}
        {images.length === 0 ? (
          <p className="text-center py-24" style={{ color: 'rgba(255,255,255,0.2)' }}>
            暂无图片
          </p>
        ) : filtered.length === 0 ? (
          <p className="text-center py-24" style={{ color: 'rgba(255,255,255,0.2)' }}>
            该分类暂无图片
          </p>
        ) : (
          // key 随 active 变化，强制 FilmStrip 重置到第 0 帧
          <FilmStrip key={active} images={filtered} />
        )}

      </div>
    </div>
  )
}

// ── Tab 子组件 ────────────────────────────────────────────────────────────────
function CategoryTab({
  name,
  count,
  active,
  onClick,
}: {
  name: string
  count: number
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest transition-all duration-300"
      style={
        active
          ? {
              background: 'rgba(200,169,126,0.15)',
              border: '1px solid rgba(200,169,126,0.45)',
              color: '#c8a97e',
            }
          : {
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: 'rgba(255,255,255,0.3)',
            }
      }
    >
      {name}
      <span
        className="font-mono text-[9px] tracking-normal"
        style={{ opacity: 0.6 }}
      >
        {count}
      </span>
    </button>
  )
}
