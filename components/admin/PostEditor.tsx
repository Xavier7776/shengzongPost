// components/admin/PostEditor.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Save, Eye, EyeOff, Loader2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface Props {
  mode: 'new' | 'edit'
  initialData?: {
    slug: string
    title: string
    excerpt: string
    content: string
    tags: string[]
    published: boolean
  }
}

export default function PostEditor({ mode, initialData }: Props) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [preview, setPreview] = useState(false)
  const [error, setError] = useState('')

  const [slug, setSlug]       = useState(initialData?.slug ?? '')
  const [title, setTitle]     = useState(initialData?.title ?? '')
  const [excerpt, setExcerpt] = useState(initialData?.excerpt ?? '')
  const [content, setContent] = useState(initialData?.content ?? '')
  const [tagsRaw, setTagsRaw] = useState(initialData?.tags?.join(', ') ?? '')
  const [published, setPublished] = useState(initialData?.published ?? false)

  // 自动从标题生成 slug（新建时）
  function handleTitleChange(val: string) {
    setTitle(val)
    if (mode === 'new' && !slug) {
      setSlug(
        val.toLowerCase()
          .replace(/\s+/g, '-')
          .replace(/[^\w-]/g, '')
          .slice(0, 80)
      )
    }
  }

  async function handleSave(pub?: boolean) {
    const finalPublished = pub !== undefined ? pub : published
    setSaving(true)
    setError('')

    const body = {
      slug,
      title,
      excerpt,
      content,
      tags: tagsRaw.split(',').map(t => t.trim()).filter(Boolean),
      published: finalPublished,
    }

    const res = await fetch(
      mode === 'new' ? '/api/posts' : `/api/posts/${initialData!.slug}`,
      {
        method: mode === 'new' ? 'POST' : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }
    )

    setSaving(false)

    if (!res.ok) {
      const data = await res.json()
      setError(data.error ?? '保存失败')
      return
    }

    // 保存成功：跳回后台列表
    router.push('/admin')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-[#FAFAF8] flex flex-col">
      {/* Toolbar */}
      <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center gap-4">
        <Link href="/admin" className="p-2 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <h1 className="text-sm font-black text-gray-600 tracking-widest uppercase flex-1">
          {mode === 'new' ? '新建文章' : '编辑文章'}
        </h1>

        <button
          onClick={() => setPreview(v => !v)}
          className="flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          {preview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          {preview ? '编辑' : '预览'}
        </button>

        {/* 存为草稿 */}
        <button
          onClick={() => handleSave(false)}
          disabled={saving}
          className="flex items-center gap-2 text-xs font-bold text-gray-600 border border-gray-200 px-4 py-2 rounded-xl hover:border-gray-400 transition-colors disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          存草稿
        </button>

        {/* 发布 */}
        <button
          onClick={() => handleSave(true)}
          disabled={saving}
          className="flex items-center gap-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl transition-colors disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          发布
        </button>
      </header>

      {error && (
        <div className="bg-red-50 border-b border-red-100 px-6 py-3 text-sm text-red-600 font-medium">
          ⚠ {error}
        </div>
      )}

      {/* Meta fields */}
      <div className="border-b border-gray-100 bg-white px-6 py-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-1.5">标题</label>
          <input
            value={title}
            onChange={e => handleTitleChange(e.target.value)}
            placeholder="文章标题"
            className="w-full text-sm font-bold text-gray-900 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-blue-400 focus:bg-white transition"
          />
        </div>
        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-1.5">Slug（URL）</label>
          <input
            value={slug}
            onChange={e => setSlug(e.target.value)}
            placeholder="url-friendly-slug"
            className="w-full text-sm font-mono text-gray-600 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-blue-400 focus:bg-white transition"
          />
        </div>
        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-1.5">标签（逗号分隔）</label>
          <input
            value={tagsRaw}
            onChange={e => setTagsRaw(e.target.value)}
            placeholder="Next.js, TypeScript, AI"
            className="w-full text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-blue-400 focus:bg-white transition"
          />
        </div>
        <div className="md:col-span-3">
          <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-1.5">摘要</label>
          <input
            value={excerpt}
            onChange={e => setExcerpt(e.target.value)}
            placeholder="文章摘要，显示在列表页"
            className="w-full text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-blue-400 focus:bg-white transition"
          />
        </div>
      </div>

      {/* Editor / Preview */}
      <div className="flex-1 flex">
        {!preview ? (
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="在这里写 Markdown 正文..."
            className="flex-1 w-full resize-none font-mono text-sm text-gray-700 leading-relaxed bg-[#FAFAF8] px-10 py-8 focus:outline-none"
            style={{ minHeight: '60vh' }}
          />
        ) : (
          <div className="flex-1 max-w-[780px] mx-auto px-10 py-8 text-gray-700 leading-[1.9]">
            <h1 className="text-4xl font-black tracking-tighter text-gray-900 mb-4">{title || '（无标题）'}</h1>
            <p className="text-gray-400 text-sm mb-8 font-mono">{slug}</p>
            {/* 简单预览：保留换行 */}
            <pre className="whitespace-pre-wrap font-sans text-base leading-relaxed">{content}</pre>
          </div>
        )}
      </div>
    </div>
  )
}
