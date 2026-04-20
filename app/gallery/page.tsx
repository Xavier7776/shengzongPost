// app/gallery/page.tsx
import FilmStrip from '@/components/sections/FilmStrip'
import { getAllGalleryImages } from '@/lib/db'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata: Metadata = {
  title: '视觉存档 — ARC.',
  description: '极简主义摄影与视觉创作存档',
}

export default async function GalleryPage() {
  const dbImages = await getAllGalleryImages()

  // 转成 FilmStrip 需要的格式
  const images = dbImages.map(img => ({
    id: img.id,
    url: img.url,
    category: img.category || 'Photo',
    title: img.title || '无标题',
  }))

  return (
    <div className="animate-in">
      <div className="max-w-6xl mx-auto px-6 py-24">
        {/* Header */}
        <div className="mb-14">
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

        {images.length === 0 ? (
          <p className="text-center py-24" style={{ color: 'rgba(255,255,255,0.2)' }}>
            暂无图片
          </p>
        ) : (
          <FilmStrip images={images} />
        )}
      </div>
    </div>
  )
}
