'use client'

// app/admin/gallery/page.tsx
// 图库管理主页面：状态编排 + 布局。卡片见 ImageCard.tsx，上传见 Uploader.tsx

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Loader2, ImageOff } from 'lucide-react'
import ImageCard from './ImageCard'
import { UploadZone, InlineUploadForm } from './Uploader'
import type { GalleryImage, PendingFile, EditPayload } from './types'

export default function AdminGalleryPage() {
  const [images, setImages] = useState<GalleryImage[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  // 上传队列：选了多张图时逐张确认
  const [queue, setQueue] = useState<PendingFile[]>([])
  const current = queue[0] ?? null

  useEffect(() => {
    fetch('/api/gallery')
      .then(async r => {
        const data = await r.json()
        if (!r.ok) throw new Error(data?.error || `HTTP ${r.status}`)
        return data
      })
      .then(data => {
        setImages(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(err => {
        console.error('[gallery load]', err)
        setLoadError(String(err))
        setLoading(false)
      })
  }, [])

  // 已有分类（供弹窗快捷选择）
  const existingCategories = Array.from(new Set(images.map(i => i.category).filter(Boolean)))

  function handleFiles(files: File[]) {
    const pending = files.map(file => ({
      file,
      preview: URL.createObjectURL(file),
    }))
    setQueue(prev => [...prev, ...pending])
  }

  async function handleConfirm(title: string, category: string, description: string, tags: string[]) {
    if (!current) return
    const fd = new FormData()
    fd.append('file', current.file)
    fd.append('title', title)
    fd.append('category', category)
    if (description) fd.append('description', description)
    if (tags.length) fd.append('tags', tags.join(','))
    const res = await fetch('/api/gallery/upload', { method: 'POST', body: fd })
    const data = await res.json()
    if (data.image) setImages(prev => [data.image, ...prev])
    URL.revokeObjectURL(current.preview)
    setQueue(prev => prev.slice(1))
  }

  function handleCancel() {
    if (!current) return
    URL.revokeObjectURL(current.preview)
    setQueue(prev => prev.slice(1))
  }

  function handleDelete(id: number) {
    setImages(prev => prev.filter(i => i.id !== id))
  }

  function handleUpdate(id: number, data: EditPayload) {
    setImages(prev => prev.map(i => i.id === id ? {
      ...i,
      title: data.title,
      category: data.category,
      description: data.description,
      tags: data.tags,
      is_featured: data.is_featured ?? i.is_featured,
    } : i))
  }

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-8 py-5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin" className="text-gray-400 hover:text-gray-700 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-black tracking-tighter text-gray-900">
              ARC<span className="text-blue-600">.</span> Gallery 管理
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">{images.length} 张图片</p>
          </div>
        </div>
        {queue.length > 1 && (
          <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
            待处理 {queue.length} 张
          </span>
        )}
      </header>

      <main className="max-w-6xl mx-auto px-8 py-10 space-y-8">
        <UploadZone onFiles={handleFiles} />

        {/* 内联上传表单：有待处理图片时显示在上传区下方 */}
        {current && (
          <InlineUploadForm
            pending={current}
            existingCategories={existingCategories}
            onConfirm={handleConfirm}
            onCancel={handleCancel}
          />
        )}

        {loading ? (
          <div className="flex items-center justify-center py-24 text-gray-300">
            <Loader2 className="w-8 h-8 animate-spin" />
            <span className="ml-3 text-sm font-medium">正在读取图片…</span>
          </div>
        ) : loadError ? (
          <div className="text-center py-24 text-red-400 space-y-3">
            <p className="font-bold text-base">图片读取失败</p>
            <p className="text-xs font-mono bg-red-50 inline-block px-3 py-1.5 rounded-lg">{loadError}</p>
            <div>
              <button
                onClick={() => window.location.reload()}
                className="mt-2 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-600 text-xs font-bold rounded-xl transition-colors"
              >
                刷新重试
              </button>
            </div>
          </div>
        ) : images.length === 0 ? (
          <div className="text-center py-24 text-gray-300">
            <ImageOff className="w-12 h-12 mx-auto mb-4" />
            <p className="font-bold">还没有图片，点击上方区域开始上传</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.map(img => (
              <ImageCard
                key={img.id}
                image={img}
                onDelete={handleDelete}
                onUpdate={handleUpdate}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
