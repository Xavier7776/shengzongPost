'use client'

// app/admin/slides/page.tsx
import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, Plus, Trash2, Pencil, Check, X,
  Loader2, GripVertical, Eye, EyeOff, ImageOff, Layers,
} from 'lucide-react'

interface HeroSlide {
  id: number
  img: string
  title: string
  subtitle: string
  sort_order: number
  enabled: boolean
  created_at: string
}

// ── 单张幻灯片卡片 ────────────────────────────────────────────────────────────
function SlideCard({
  slide,
  onDelete,
  onUpdate,
}: {
  slide: HeroSlide
  onDelete: (id: number) => void
  onUpdate: (id: number, data: Partial<HeroSlide>) => void
}) {
  const [editing, setEditing] = useState(false)
  const [img, setImg]         = useState(slide.img)
  const [title, setTitle]     = useState(slide.title)
  const [subtitle, setSubtitle] = useState(slide.subtitle)
  const [order, setOrder]     = useState(String(slide.sort_order ?? ''))
  const [saving, setSaving]   = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [toggling, setToggling] = useState(false)
  const [imgError, setImgError] = useState(false)

  async function handleSave() {
    setSaving(true)
    const res = await fetch(`/api/slides/${slide.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        img: img.trim(),
        title: title.trim(),
        subtitle: subtitle.trim(),
        sort_order: order !== '' ? Number(order) : null,
      }),
    })
    const data = await res.json()
    if (data.slide) onUpdate(slide.id, data.slide)
    setSaving(false)
    setEditing(false)
  }

  function handleCancel() {
    setImg(slide.img); setTitle(slide.title)
    setSubtitle(slide.subtitle); setOrder(String(slide.sort_order ?? ''))
    setEditing(false)
  }

  async function handleDelete() {
    if (!confirm(`确认删除「${slide.title}」？`)) return
    setDeleting(true)
    await fetch(`/api/slides/${slide.id}`, { method: 'DELETE' })
    onDelete(slide.id)
  }

  async function handleToggle() {
    setToggling(true)
    const res = await fetch(`/api/slides/${slide.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled: !slide.enabled }),
    })
    const data = await res.json()
    if (data.slide) onUpdate(slide.id, data.slide)
    setToggling(false)
  }

  return (
    <div className={`bg-white border rounded-2xl overflow-hidden transition-all duration-200 ${
      slide.enabled ? 'border-gray-100 hover:border-gray-200 hover:shadow-md' : 'border-gray-100 opacity-60'
    }`}>
      <div className="flex gap-0">
        {/* 拖拽手柄 + 排序号 */}
        <div className="flex flex-col items-center justify-center px-3 gap-1 text-gray-200 bg-gray-50 border-r border-gray-100 cursor-grab">
          <GripVertical className="w-4 h-4" />
          <span className="text-[10px] font-mono">{slide.sort_order ?? '—'}</span>
        </div>

        {/* 图片预览 */}
        <div className="relative flex-shrink-0 w-48 bg-gray-100" style={{ minHeight: 120 }}>
          {imgError ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-gray-300">
              <ImageOff className="w-7 h-7" />
              <span className="text-[9px]">图片加载失败</span>
            </div>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={slide.img}
              alt={slide.title}
              className="absolute inset-0 w-full h-full object-cover"
              onError={() => setImgError(true)}
            />
          )}
          {/* 启用/禁用角标 */}
          <div className={`absolute top-2 left-2 text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md ${
            slide.enabled ? 'bg-green-500 text-white' : 'bg-gray-400 text-white'
          }`}>
            {slide.enabled ? 'ON' : 'OFF'}
          </div>
        </div>

        {/* 内容区 */}
        <div className="flex-1 px-5 py-4 min-w-0">
          {editing ? (
            <div className="space-y-2">
              <div>
                <label className="text-[9px] font-black uppercase tracking-widest text-gray-400">图片 URL</label>
                <input
                  value={img}
                  onChange={e => { setImg(e.target.value); setImgError(false) }}
                  placeholder="https://..."
                  className="w-full mt-0.5 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-mono text-gray-700 focus:outline-none focus:border-blue-400"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[9px] font-black uppercase tracking-widest text-gray-400">标题</label>
                  <input
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="幻灯片标题"
                    className="w-full mt-0.5 border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm font-bold text-gray-900 focus:outline-none focus:border-blue-400"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-black uppercase tracking-widest text-gray-400">排序（小的在前）</label>
                  <input
                    type="number"
                    value={order}
                    onChange={e => setOrder(e.target.value)}
                    placeholder="0"
                    className="w-full mt-0.5 border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm text-gray-700 focus:outline-none focus:border-blue-400"
                  />
                </div>
              </div>
              <div>
                <label className="text-[9px] font-black uppercase tracking-widest text-gray-400">副标题描述</label>
                <textarea
                  value={subtitle}
                  onChange={e => setSubtitle(e.target.value)}
                  placeholder="一句话描述"
                  rows={2}
                  className="w-full mt-0.5 border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm text-gray-600 resize-none focus:outline-none focus:border-blue-400"
                />
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-1.5 rounded-lg transition-colors disabled:opacity-60"
                >
                  {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}保存
                </button>
                <button
                  onClick={handleCancel}
                  className="flex items-center gap-1 bg-gray-100 hover:bg-gray-200 text-gray-500 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
                >
                  <X className="w-3 h-3" />取消
                </button>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col justify-between">
              <div>
                <p className="font-black text-gray-900 text-sm truncate">{slide.title}</p>
                <p className="text-xs text-gray-400 mt-1 line-clamp-2 leading-relaxed">{slide.subtitle}</p>
                <p className="text-[10px] font-mono text-gray-300 mt-2 truncate">{slide.img}</p>
              </div>
            </div>
          )}
        </div>

        {/* 操作栏 */}
        {!editing && (
          <div className="flex flex-col gap-2 justify-center px-4 border-l border-gray-100 bg-gray-50">
            <button
              onClick={handleToggle}
              disabled={toggling}
              title={slide.enabled ? '点击禁用' : '点击启用'}
              className={`p-2 rounded-xl transition-colors ${
                slide.enabled
                  ? 'text-green-500 hover:bg-green-50'
                  : 'text-gray-400 hover:bg-gray-100'
              }`}
            >
              {toggling
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : slide.enabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />
              }
            </button>
            <button
              onClick={() => setEditing(true)}
              className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="p-2 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── 新建表单 ──────────────────────────────────────────────────────────────────
function CreateForm({ onCreated }: { onCreated: (slide: HeroSlide) => void }) {
  const [open, setOpen] = useState(false)
  const [img, setImg]       = useState('')
  const [title, setTitle]   = useState('')
  const [subtitle, setSubtitle] = useState('')
  const [order, setOrder]   = useState('')
  const [saving, setSaving] = useState(false)
  const [previewErr, setPreviewErr] = useState(false)

  async function handleCreate() {
    if (!img.trim() || !title.trim() || !subtitle.trim()) return
    setSaving(true)
    const res = await fetch('/api/slides', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        img: img.trim(), title: title.trim(), subtitle: subtitle.trim(),
        sort_order: order !== '' ? Number(order) : undefined,
      }),
    })
    const data = await res.json()
    if (data.slide) {
      onCreated(data.slide)
      setImg(''); setTitle(''); setSubtitle(''); setOrder('')
      setOpen(false)
    }
    setSaving(false)
  }

  return (
    <div>
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-gray-200 hover:border-blue-400 hover:bg-blue-50 text-gray-400 hover:text-blue-600 rounded-2xl py-6 text-sm font-bold transition-all duration-200"
        >
          <Plus className="w-4 h-4" />新建幻灯片
        </button>
      ) : (
        <div className="bg-white border border-blue-200 rounded-2xl p-6 space-y-4">
          <p className="text-sm font-black text-gray-900">新建幻灯片</p>

          {/* 图片 URL + 预览 */}
          <div className="flex gap-4">
            <div className="flex-1 space-y-2">
              <div>
                <label className="text-[9px] font-black uppercase tracking-widest text-gray-400">图片 URL *</label>
                <input
                  value={img}
                  onChange={e => { setImg(e.target.value); setPreviewErr(false) }}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full mt-0.5 border border-gray-200 rounded-xl px-3 py-2 text-xs font-mono text-gray-700 focus:outline-none focus:border-blue-400"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[9px] font-black uppercase tracking-widest text-gray-400">标题 *</label>
                  <input
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="探索 AI 前沿"
                    className="w-full mt-0.5 border border-gray-200 rounded-xl px-3 py-2 text-sm font-bold text-gray-900 focus:outline-none focus:border-blue-400"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-black uppercase tracking-widest text-gray-400">排序</label>
                  <input
                    type="number"
                    value={order}
                    onChange={e => setOrder(e.target.value)}
                    placeholder="0"
                    className="w-full mt-0.5 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-blue-400"
                  />
                </div>
              </div>
              <div>
                <label className="text-[9px] font-black uppercase tracking-widest text-gray-400">副标题描述 *</label>
                <textarea
                  value={subtitle}
                  onChange={e => setSubtitle(e.target.value)}
                  placeholder="一句话介绍这张幻灯片的主题"
                  rows={2}
                  className="w-full mt-0.5 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-600 resize-none focus:outline-none focus:border-blue-400"
                />
              </div>
            </div>
            {/* 右侧预览 */}
            {img && (
              <div className="flex-shrink-0 w-36 h-28 rounded-xl overflow-hidden bg-gray-100">
                {previewErr ? (
                  <div className="w-full h-full flex items-center justify-center text-gray-300">
                    <ImageOff className="w-6 h-6" />
                  </div>
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={img} alt="" className="w-full h-full object-cover"
                    onError={() => setPreviewErr(true)} />
                )}
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-1">
            <button
              onClick={handleCreate}
              disabled={saving || !img.trim() || !title.trim() || !subtitle.trim()}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-colors disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              创建
            </button>
            <button
              onClick={() => { setOpen(false); setImg(''); setTitle(''); setSubtitle(''); setOrder('') }}
              className="px-5 py-2.5 rounded-xl text-sm font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              取消
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── 主页面 ────────────────────────────────────────────────────────────────────
export default function AdminSlidesPage() {
  const [slides, setSlides] = useState<HeroSlide[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/slides?admin=1')
      .then(async r => {
        const data = await r.json()
        if (!r.ok) throw new Error(data?.error || `HTTP ${r.status}`)
        return data
      })
      .then(data => { setSlides(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(err => { setError(String(err)); setLoading(false) })
  }, [])

  function handleDelete(id: number) {
    setSlides(prev => prev.filter(s => s.id !== id))
  }

  function handleUpdate(id: number, data: Partial<HeroSlide>) {
    setSlides(prev => prev.map(s => s.id === id ? { ...s, ...data } : s))
  }

  function handleCreated(slide: HeroSlide) {
    setSlides(prev => [...prev, slide])
  }

  const enabledCount = slides.filter(s => s.enabled).length

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
              ARC<span className="text-blue-600">.</span> 首页轮播管理
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">
              {slides.length} 张幻灯片 · {enabledCount} 张已启用
            </p>
          </div>
        </div>
        {/* 实时预览链接 */}
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-bold text-gray-400 hover:text-blue-600 transition-colors flex items-center gap-1.5 border border-gray-200 hover:border-blue-300 px-3 py-1.5 rounded-xl"
        >
          <Eye className="w-3.5 h-3.5" />预览首页
        </a>
      </header>

      <main className="max-w-4xl mx-auto px-8 py-10 space-y-4">
        {/* 提示：数据库建表 */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-3.5 flex items-start gap-3">
          <Layers className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-amber-700 leading-relaxed">
            <strong>首次使用：</strong>请先在 Neon 数据库执行建表 SQL（见下方说明），Hero 组件会优先从数据库读取，若无数据则降级到 <code className="font-mono bg-amber-100 px-1 rounded">lib/data.ts</code> 的静态配置。
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24 text-gray-300">
            <Loader2 className="w-8 h-8 animate-spin" />
            <span className="ml-3 text-sm font-medium">加载中…</span>
          </div>
        ) : error ? (
          <div className="text-center py-24 text-red-400 space-y-3">
            <p className="font-bold">读取失败</p>
            <p className="text-xs font-mono bg-red-50 px-3 py-1.5 rounded-lg inline-block">{error}</p>
            <div><button onClick={() => window.location.reload()} className="mt-2 px-4 py-2 bg-red-100 text-red-600 text-xs font-bold rounded-xl">刷新重试</button></div>
          </div>
        ) : (
          <>
            {slides.length === 0 && !loading && (
              <div className="text-center py-12 text-gray-300">
                <Layers className="w-10 h-10 mx-auto mb-3" />
                <p className="font-bold text-sm">暂无幻灯片，点击下方创建第一张</p>
              </div>
            )}
            <div className="space-y-3">
              {slides.map(slide => (
                <SlideCard
                  key={slide.id}
                  slide={slide}
                  onDelete={handleDelete}
                  onUpdate={handleUpdate}
                />
              ))}
            </div>
            <CreateForm onCreated={handleCreated} />
          </>
        )}
      </main>
    </div>
  )
}
