import FilmStrip from '@/components/sections/FilmStrip'
import { GALLERY_IMAGES } from '@/lib/data'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '视觉存档 — ARC.',
  description: '极简主义摄影与视觉创作存档',
}

export default function GalleryPage() {
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

        <FilmStrip images={GALLERY_IMAGES} />
      </div>
    </div>
  )
}
