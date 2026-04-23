'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, Upload, Trash2, Pencil, Check, X, ImageOff, Loader2,
} from 'lucide-react'

interface GalleryImage {
  id: number
  url: string
  title: string
  category: string
  sort_order: number
  created_at: string
}

interface PendingFile {
  file: File
  preview: string
}

// ─── 单张图片卡片 ────────────────────────────────────────────────────────────

function ImageCard({
  image,
  onDelete,
  onUpdate,
}: {
  image: GalleryImage
  onDelete: (id: number) => void
  onUpdate: (id: number, data: { title: string; category: string }) => void
}) {
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(image.title)
  const [category, setCategory] = useState(image.category)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  // ✅ 修复：图片加载失败时展示兜底占位，防止一张图出错导致后续渲染中断
  const [imgError, setImgError] = useState(false)

  async function handleSave() {
    setSaving(true)
    await fetch(`/api/gallery/${image.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, category }),
    })
    onUpdate(image.id, { title, category })
    setSaving(false)
    setEditing(false)
  }

  function handleCancel() {
    setTitle(image.title)
    setCategory(image.category)
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
              {image.category && (
                <span className="inline-block mt-1 text-[10px] font-black uppercase tracking-widest text-blue-500 bg-blue-50 px-2 py-0.5 rounded-md">
                  {image.category}
                </span>
              )}
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

// ─── 预设分类列表（可自由修改）─────────────────────────────────────────────
const PRESET_CATEGORIES = ['Photo', 'Film', 'Urban', 'Portrait', 'Nature', 'Architecture', 'Travel', 'Abstract']

// ─── 上传区（拖拽选图 + 内联表单）─────────────────────────────────────────

function UploadZone({ onFiles }: { onFiles: (files: File[]) => void }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  function handleFiles(fileList: FileList | null) {
    if (!fileList) return
    const imgs = Array.from(fileList).filter(f => f.type.startsWith('image/'))
    if (imgs.length) onFiles(imgs)
  }

  return (
    <div
      onDragOver={e => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={e => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files) }}
      onClick={() => inputRef.current?.click()}
      className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all duration-200 select-none
        ${dragging ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}
      `}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={e => handleFiles(e.target.files)}
      />
      <Upload className="w-8 h-8 text-gray-300" />
      <p className="text-sm font-bold text-gray-400">点击或拖拽图片，上传前可设置标题和分类</p>
      <p className="text-xs text-gray-300">支持 JPG、PNG、WEBP，可多选（逐张确认）</p>
    </div>
  )
}

// ─── 内联上传表单（选完图后在 UploadZone 下方展开）──────────────────────────

function InlineUploadForm({
  pending,
  existingCategories,
  onConfirm,
  onCancel,
}: {
  pending: PendingFile
  existingCategories: string[]
  onConfirm: (title: string, category: string) => Promise<void>
  onCancel: () => void
}) {
  const [title, setTitle] = useState(pending.file.name.replace(/\.[^.]+$/, ''))
  const [category, setCategory] = useState('')
  const [customCat, setCustomCat] = useState('')
  const [uploading, setUploading] = useState(false)

  const allCategories = Array.from(new Set([...existingCategories, ...PRESET_CATEGORIES]))
  const finalCategory = category === '__custom__' ? customCat.trim() : category

  async function handleSubmit() {
    if (!finalCategory) return
    setUploading(true)
    await onConfirm(title, finalCategory)
    setUploading(false)
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
      <div className="flex gap-5 p-5">
        {/* 左：图片预览 */}
        <div className="relative flex-shrink-0 w-40 rounded-xl overflow-hidden bg-gray-100" style={{ height: 120 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={pending.preview} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          <div className="absolute bottom-1.5 left-2 right-2 text-white/60 text-[9px] font-mono truncate">
            {pending.file.name}
          </div>
        </div>

        {/* 右：标题 + 分类 */}
        <div className="flex-1 space-y-3">
          {/* 标题 */}
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1 block">标题</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="输入图片标题"
              autoFocus
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm font-medium text-gray-900 focus:outline-none focus:border-blue-400 transition-colors"
            />
          </div>

          {/* 分类 */}
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1 block">分类</label>
            <div className="flex flex-wrap gap-1.5 mb-1.5">
              {allCategories.map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all"
                  style={
                    category === cat
                      ? { background: '#2563eb', color: '#fff' }
                      : { background: '#f1f5f9', color: '#64748b' }
                  }
                >
                  {cat}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setCategory('__custom__')}
                className="px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all"
                style={
                  category === '__custom__'
                    ? { background: '#2563eb', color: '#fff' }
                    : { background: '#f1f5f9', color: '#64748b' }
                }
              >
                + 自定义
              </button>
            </div>
            {category === '__custom__' && (
              <input
                value={customCat}
                onChange={e => setCustomCat(e.target.value)}
                placeholder="输入自定义分类名"
                autoFocus
                className="w-full border border-blue-300 rounded-xl px-3 py-2 text-sm font-medium text-gray-900 focus:outline-none focus:border-blue-400 transition-colors"
              />
            )}
          </div>
        </div>
      </div>

      {/* 底部操作 */}
      <div className="flex gap-2 px-5 pb-5">
        <button
          onClick={onCancel}
          disabled={uploading}
          className="flex-none px-5 py-2.5 rounded-xl text-sm font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-50"
        >
          取消
        </button>
        <button
          onClick={handleSubmit}
          disabled={uploading || !finalCategory}
          className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {uploading
            ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />上传中…</>
            : <><Upload className="w-3.5 h-3.5" />确认上传</>}
        </button>
      </div>
    </div>
  )
}

// ─── 主页面 ──────────────────────────────────────────────────────────────────

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

  async function handleConfirm(title: string, category: string) {
    if (!current) return
    const fd = new FormData()
    fd.append('file', current.file)
    fd.append('title', title)
    fd.append('category', category)
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

  function handleUpdate(id: number, data: { title: string; category: string }) {
    setImages(prev => prev.map(i => i.id === id ? { ...i, ...data } : i))
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
