'use client'

// app/gallery/types.ts
// 图库页共享类型 + 工具函数

export interface GalleryItem {
  id: number
  url: string
  category: string
  title: string
  description: string | null
  tags: string[]
  width: number
  height: number
  likes: number
}

export type GalleryView = 'masonry' | 'film'

// 从 Cloudinary URL 派生低清模糊占位图；非 Cloudinary 地址原样返回
export function blurPlaceholder(url: string): string {
  const m = url.match(/^(https:\/\/res\.cloudinary\.com\/[^/]+\/(?:image|video)\/upload\/)(.+)$/)
  if (!m) return url
  return `${m[1]}w_32,e_blur:800,q_auto:lowest/${m[2]}`
}

export function ratioOf(img: GalleryItem): number {
  if (img.width > 0 && img.height > 0) return img.width / img.height
  return 4 / 3 // 旧数据无尺寸时的兜底比例，加载后由 onLoad 回填
}
