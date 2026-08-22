// app/gallery/page.tsx
import { getAllGalleryImages, getGalleryTagStats } from '@/lib/db'
import type { Metadata } from 'next'
import GalleryClient from './GalleryClient'

// 图库页需要实时展示最新上传，force-dynamic 已足够
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: '视觉存档 — MindStack.',
  description: '极简主义摄影与视觉创作存档',
  openGraph: {
    title: '视觉存档 — MindStack.',
    images: [{ url: '/api/og?kind=gallery', width: 1200, height: 630 }],
  },
}

export default async function GalleryPage({
  searchParams,
}: {
  searchParams: Promise<{ image?: string }>
}) {
  const { image } = await searchParams
  const [dbImages, tagStats] = await Promise.all([
    getAllGalleryImages(),
    // 052 迁移未执行时 tags 列不存在，降级为空标签列表而不是整页报错
    getGalleryTagStats().catch(() => []),
  ])

  const images = dbImages.map(img => ({
    id: img.id,
    url: img.url,
    category: img.category || 'Photo',
    title: img.title || '无标题',
    description: img.description ?? null,
    tags: img.tags ?? [],
    width: img.width ?? 0,
    height: img.height ?? 0,
    likes: img.likes ?? 0,
  }))

  const initialImageId = image ? Number(image) : null

  return <GalleryClient images={images} tags={tagStats} initialImageId={initialImageId} />
}
