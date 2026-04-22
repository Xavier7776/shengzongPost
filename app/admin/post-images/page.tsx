'use client'

// app/admin/post-images/page.tsx — 博文插图管理台
import { useEffect, useState, useRef, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  ArrowLeft, Trash2, ImageOff, Loader2, Search, X,
  ExternalLink, Copy, Check, Filter, RefreshCw, ImagePlus,
} from 'lucide-react'

interface PostImage {
  id: number
  post_slug: string | null
  url: string
  public_id: string
  filename: string
  size: number
  mime_type: string
  uploaded_by: number
  created_at: string
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  function handleCopy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }
  return (
    <button
      onClick={handleCopy}
      title="复制图片地址"
      className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  )
}

function ImageCard({
  image,
  onDelete,
}: {
  image: PostImage
  onDelete: (id: number) => void
}) {
  const [deleting, setDeleting] = useState(false)
  const [imgErr, setImgErr] = useState(false)

  async function handleDelete() {
    if (!confirm(`确认删除「${image.filename}」？此操作不可撤销，图片将从存储中永久删除。`)) return
    setDeleting(true)
    const res = await fetch(`/api/posts/image?id=${image.id}`, { method: 'DELETE' })
    if (res.ok) {
      onDelete(image.id)
    } else {
      const d = await res.json()
      alert(d.error ?? '删除失败')
      setDeleting(false)
    }
  }

  return (
    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden hover:border-gray-200 hover:shadow-sm transition-all group">
      {/* 图片预览 */}
      <div className="relative aspect-video bg-gray-50 overflow-hidden">
        {imgErr ? (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-gray-300">
            <ImageOff className="w-8 h-8" />
            <span className="text-xs">图片加载失败</span>
          </div>
        ) : (
          <Image
            src={image.url}
            alt={image.filename}
            fill
            className="object-cover"
            onError={() => setImgErr(true)}
            unoptimized
          />
        )}

        {/* hover 操作层 */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
          <a
            href={image.url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 bg-white/90 rounded-xl text-gray-700 hover:text-blue-600 transition-colors"
            title="在新窗口打开"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="p-2 bg-white/90 rounded-xl text-gray-700 hover:text-red-600 transition-colors disabled:opacity-50"
            title="删除图片"
          >
            {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* 图片信息 */}
      <div className="p-3">
        <p className="text-xs font-bold text-gray-800 truncate mb-1" title={image.filename}>
          {image.filename}
        </p>
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] text-gray-400 font-mono">{formatBytes(image.size)}</span>
            <span className="text-[10px] text-gray-400 font-mono">{image.created_at.slice(0, 10)}</span>
          </div>
          <div className="flex items-center gap-0.5">
            <CopyButton text={`![${image.filename}](${image.url})`} />
            <a
              href={image.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
              title="打开原图"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* 关联文章 */}
        {image.post_slug ? (
          <Link
            href={`/blog/${image.post_slug}`}
            target="_blank"
            className="mt-2 flex items-center gap-1 text-[10px] text-blue-500 hover:text-blue-700 font-mono truncate"
          >
            <span className="shrink-0">📄</span>
            <span className="truncate">/{image.post_slug}</span>
          </Link>
        ) : (
          <p className="mt-2 text-[10px] text-gray-300 font-mono">未关联文章</p>
        )}
      </div>
    </div>
  )
}

export default function PostImagesPage() {
  const [images, setImages]     = useState<PostImage[]>([])
  const [loading, setLoading]   = useState(true)
  const [query, setQuery]       = useState('')
  const [slugFilter, setSlugFilter] = useState('')
  const [uploading, setUploading]   = useState(false)
  const [uploadErr, setUploadErr]   = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const url = slugFilter
        ? `/api/posts/image?slug=${encodeURIComponent(slugFilter)}`
        : '/api/posts/image'
      const res = await fetch(url)
      if (res.ok) setImages(await res.json())
    } finally {
      setLoading(false)
    }
  }, [slugFilter])

  useEffect(() => { load() }, [load])

  // 搜索过滤（客户端）
  const filtered = images.filter(img => {
    if (!query) return true
    const q = query.toLowerCase()
    return (
      img.filename.toLowerCase().includes(q) ||
      (img.post_slug ?? '').toLowerCase().includes(q)
    )
  })

  // 获取所有不重复的 slug 用于筛选下拉
  const slugOptions = Array.from(new Set(images.map(i => i.post_slug).filter(Boolean))) as string[]

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setUploadErr('')
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/posts/image', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) { setUploadErr(data.error ?? '上传失败'); return }
      await load()
    } catch {
      setUploadErr('网络错误，请重试')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  function handleDelete(id: number) {
    setImages(prev => prev.filter(img => img.id !== id))
  }

  // 统计数据
  const totalSize = images.reduce((s, img) => s + img.size, 0)

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-8 py-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/admin"
            className="flex items-center gap-1.5 text-xs font-black tracking-widest text-gray-400 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            后台
          </Link>
          <div className="w-px h-4 bg-gray-200" />
          <div>
            <h1 className="text-base font-black tracking-tighter text-gray-900">博文插图管理</h1>
            <p className="text-[11px] text-gray-400 mt-0.5">
              {images.length} 张图片 · {formatBytes(totalSize)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={load}
            disabled={loading}
            className="flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-gray-900 px-3 py-2 rounded-xl hover:bg-gray-100 transition-colors disabled:opacity-40"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            刷新
          </button>
          <button
            onClick={() => { setUploadErr(''); fileRef.current?.click() }}
            disabled={uploading}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-colors disabled:opacity-60"
          >
            {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ImagePlus className="w-3.5 h-3.5" />}
            上传图片
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={handleUpload}
          />
        </div>
      </header>

      {uploadErr && (
        <div className="bg-red-50 border-b border-red-100 px-8 py-3 flex items-center justify-between text-sm text-red-600">
          <span>⚠ {uploadErr}</span>
          <button onClick={() => setUploadErr('')}><X className="w-4 h-4" /></button>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-8 py-8">
        {/* 搜索 + 筛选栏 */}
        <div className="flex items-center gap-3 mb-6">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="搜索文件名或 slug…"
              className="w-full pl-9 pr-8 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-blue-400 transition-colors"
            />
            {query && (
              <button onClick={() => setQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-600">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
            <select
              value={slugFilter}
              onChange={e => setSlugFilter(e.target.value)}
              className="pl-9 pr-8 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-blue-400 appearance-none cursor-pointer min-w-[160px]"
            >
              <option value="">全部文章</option>
              <option value="_unlinked">未关联文章</option>
              {slugOptions.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {(query || slugFilter) && (
            <button
              onClick={() => { setQuery(''); setSlugFilter('') }}
              className="text-xs text-gray-400 hover:text-gray-700 flex items-center gap-1"
            >
              <X className="w-3 h-3" />清空筛选
            </button>
          )}

          <span className="ml-auto text-xs text-gray-400">
            {filtered.length} / {images.length} 张
          </span>
        </div>

        {/* 内容区 */}
        {loading ? (
          <div className="flex justify-center py-24">
            <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center py-24 gap-3 text-gray-300">
            <ImageOff className="w-12 h-12" />
            <p className="text-sm">{images.length === 0 ? '还没有上传任何博文插图' : '没有匹配的图片'}</p>
            {images.length === 0 && (
              <button
                onClick={() => fileRef.current?.click()}
                className="mt-2 text-xs text-blue-500 hover:text-blue-700 font-bold"
              >
                立即上传第一张
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {filtered
              .filter(img => {
                if (slugFilter === '_unlinked') return !img.post_slug
                if (slugFilter) return img.post_slug === slugFilter
                return true
              })
              .map(img => (
                <ImageCard key={img.id} image={img} onDelete={handleDelete} />
              ))}
          </div>
        )}
      </main>
    </div>
  )
}
