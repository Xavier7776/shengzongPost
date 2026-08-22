// app/admin/gallery/types.ts
// 图库管理页共享类型

export interface GalleryImage {
  id: number
  url: string
  title: string
  category: string
  description?: string | null
  tags?: string[] | null
  width?: number
  height?: number
  likes?: number
  is_featured?: boolean
  sort_order: number
  created_at: string
}

export interface PendingFile {
  file: File
  preview: string
}

export interface EditPayload {
  title: string
  category: string
  description: string
  tags: string[]
  is_featured?: boolean
}
