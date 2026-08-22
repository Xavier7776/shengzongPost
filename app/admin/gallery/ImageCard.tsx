'use client'

// app/admin/gallery/ImageCard.tsx
// 单张图片卡片：预览 / 内联编辑（标题、分类、描述、标签、精选）/ 删除

import { useState } from 'react'
import { Trash2, Pencil, Check, X, ImageOff, Loader2, Star, Heart } from 'lucide-react'
import type { GalleryImage, EditPayload } from './types'

export default function ImageCard({
  image,
  onDelete,
  onUpdate,
}: {
  image: GalleryImage
  onDelete: (id: number) => void
  onUpdate: (id: number, data: EditPayload) => void
}) {
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(image.title)
  const [category, setCategory] = useState(image.category)
  const [description, setDescription] = useState(image.description ?? '')
  const [tags, setTags] = useState((image.tags ?? []).join(', '))
  const [featured, setFeatured] = useState(!!image.is_featured)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  // ✅ 修复：图片加载失败时展示兜底占位，防止一张图出错导致后续渲染中断
  const [imgError, setImgError] = useState(false)

  async function handleSave() {
    setSaving(true)
    const payload: EditPayload = {
      title,
      category,
      description,
      tags: tags.split(/[,，\s]+/).map(t => t.trim()).filter(Boolean).slice(0, 10),
      is_featured: featured,
    }
    await fetch(`/api/gallery/${image.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    onUpdate(image.id, payload)
    setSaving(false)
    setEditing(false)
  }

  function handleCancel() {
    setTitle(image.title)
    setCategory(image.category)
    setDescription(image.description ?? '')
    setTags((image.tags ?? []).join(', '))
    setFeatured(!!image.is_featured)
    setEditing(false)
  }

  async function handleDelete() {
    if (!confirm(`确认删除「${image.title || '该图片'}」？此操作不可撤销。`)) return
    setDeleting(true)
    await fetch(`/api/gallery/${image.id}`, { method: 'DELETE' })
    onDelete(image.id)
  }

  return (
    <div className="group bg-white border border-gray-100 rounded-2xl overflow-hidden hover:border-gray-200 hover:shadow-md transition-all duration-200">
      {/* 图片区 */}
      <div className="relative aspect-[4/3] bg-gray-50 overflow-hidden">
        {imgError ? (
          // ✅ 图片加载失败时的占位
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-gray-300">
            <ImageOff className="w-8 h-8" />
            <span className="text-[10px] font-mono px-2 text-center break-all">{image.url.split('/').pop()}</span>
          </div>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image.url}
            alt={image.title}
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        )}
        {/* 悬浮删除按钮 */}
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 bg-red-500 hover:bg-red-600 text-white p-1.5 rounded-xl transition-all duration-200 disabled:opacity-50"
        >
          {deleting
            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
            : <Trash2 className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* 信息区 */}
      <div className="px-4 py-3">
        {editing ? (
          <div className="space-y-2">
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="标题"
              className="w-full text-sm font-bold text-gray-900 border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-400"
            />
            <input
              value={category}
              onChange={e => setCategory(e.target.value)}
              placeholder="分类（如 Photo / Film / Urban）"
              className="w-full text-xs text-gray-500 border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-400"
            />
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="描述（可选，展示在灯箱信息面板）"
              rows={2}
              className="w-full text-xs text-gray-600 border border-gray-200 rounded-lg px-2.5 py-1.5 resize-none focus:outline-none focus:border-blue-400"
            />
            <input
              value={tags}
              onChange={e => setTags(e.target.value)}
              placeholder="标签，逗号分隔（如 夜景, 街拍）"
              className="w-full text-xs text-gray-500 border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-400"
            />
            <label className="flex items-center gap-2 text-xs font-bold text-gray-600 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={featured}
                onChange={e => setFeatured(e.target.checked)}
                className="w-3.5 h-3.5 accent-blue-600"
              />
              设为精选（置顶展示）
            </label>
            <div className="flex gap-2 pt-0.5">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-1.5 rounded-lg transition-colors disabled:opacity-60"
              >
                {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                保存
              </button>
              <button
                onClick={handleCancel}
                className="flex items-center justify-center px-3 bg-gray-100 hover:bg-gray-200 text-gray-500 text-xs font-bold py-1.5 rounded-lg transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm font-bold text-gray-900 truncate">
                {image.title || <span className="text-gray-300">无标题</span>}
              </p>
              <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                {image.category && (
                  <span className="inline-block text-[10px] font-black uppercase tracking-widest text-blue-500 bg-blue-50 px-2 py-0.5 rounded-md">
                    {image.category}
                  </span>
                )}
                {image.is_featured && (
                  <span className="inline-flex items-center gap-0.5 text-[10px] font-black text-amber-500 bg-amber-50 px-2 py-0.5 rounded-md">
                    <Star className="w-2.5 h-2.5 fill-current" /> 精选
                  </span>
                )}
                {(image.likes ?? 0) > 0 && (
                  <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-red-400 px-1 py-0.5">
                    <Heart className="w-2.5 h-2.5 fill-current" /> {image.likes}
                  </span>
                )}
                {(image.width ?? 0) > 0 && (
                  <span className="font-mono text-[9px] text-gray-300">{image.width}×{image.height}</span>
                )}
              </div>
            </div>
            <button
              onClick={() => setEditing(true)}
              className="shrink-0 text-gray-300 hover:text-gray-600 p-1 rounded-lg transition-colors"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
