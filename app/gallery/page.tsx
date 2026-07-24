// app/gallery/page.tsx
import { getAllGalleryImages } from '@/lib/db'
import type { Metadata } from 'next'
import GalleryClient from './GalleryClient'

// 图库页需要实时展示最新上传，force-dynamic 已足够，revalidate=0 是冗余声明
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: '视觉存档 — MindStack.',
  description: '极简主义摄影与视觉创作存档',
}

export default async function GalleryPage() {
  const dbImages = await getAllGalleryImages()

  const images = dbImages.map(img => ({
    id: img.id,
    url: img.url,
    category: img.category || 'Photo',
    title: img.title || '无标题',
  }))

  return <GalleryClient images={images} />
}
