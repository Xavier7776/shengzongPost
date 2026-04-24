'use client'

// components/dashboard/UserPostEditor.tsx
import { useState, useRef } from 'react'
import {
  Send, Eye, EyeOff, Loader2, ArrowLeft, Sparkles,
  X, ChevronRight, FileText, PenLine, AlignLeft, ImagePlus, Wand2,
} from 'lucide-react'
import Link from 'next/link'

interface Props {
  mode: 'new' | 'edit'
  /** 是否允许使用 AI 助手（管理员或特权用户才开启） */
  enableAi?: boolean
  /** 被拒绝申请的 id，重新提交时传入，提交成功后自动删除原记录 */
  fromId?: number | null
  initialData?: {
    slug: string
    title: string
    excerpt: string
    content: string
    tags: string[]
    cover_image?: string | null
  }
}

type AiMode = 'draft' | 'continue' | 'excerpt'

const AI_MODES: { key: AiMode; label: string; desc: string; icon: React.ReactNode }[] = [
  { key: 'draft',    label: '生成草稿', desc: '描述主题，AI 帮你写出完整草稿',  icon: <FileText className="w-4 h-4" /> },
  { key: 'continue', label: '续写内容', desc: '基于已有内容，AI 接着写后续段落', icon: <PenLine className="w-4 h-4" /> },
  { key: 'excerpt',  label: '生成摘要', desc: '根据正文，AI 自动生成列表页摘要', icon: <AlignLeft className="w-4 h-4" /> },
]

/** 根据标题生成 slug：保留英文/数字，中文兜底为 code point 短串 */
function titleToSlug(title: string): string {
  const ascii = title
    .toLowerCase()
    .replace(/[\s_]+/g, '-')
    .replace(/[^\w-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80)
  if (ascii.length >= 3) return ascii
  const hash = Array.from(title).map(c => c.codePointAt(0)!.toString(36)).join('').slice(0, 12)
  const rand = Math.random().toString(36).slice(2, 6)
  return `post-${hash}-${rand}`
}

export default function UserPostEditor({ mode, enableAi = false, fromId, initialData }: Props) {
  const [submitting, setSubmitting] = useState(false)
  const [preview, setPreview]       = useState(false)
  const [error, setError]           = useState('')
  const [submitted, setSubmitted]   = useState(false)

  const [slug, setSlug]       = useState(initialData?.slug ?? '')
  const [title, setTitle]     = useState(initialData?.title ?? '')
  const [excerpt, setExcerpt] = useState(initialData?.excerpt ?? '')
  const [content, setContent] = useState(initialData?.content ?? '')
  const [tagsRaw, setTagsRaw] = useState(initialData?.tags?.join(', ') ?? '')
  const [coverImage, setCoverImage] = useState<string>(initialData?.cover_image ?? '')
  const [coverImageId, setCoverImageId] = useState<number | null>(null)
  const [slugGenerating, setSlugGenerating] = useState(false)

  const coverFileRef = useRef<HTMLInputElement>(null)
  const [uploadingCover, setUploadingCover] = useState(false)
  const [coverUploadError, setCoverUploadError] = useState('')

  const [aiOpen, setAiOpen]       = useState(false)
  const [aiMode, setAiMode]       = useState<AiMode>('draft')
  const [aiPrompt, setAiPrompt]   = useState('')
  const [aiResult, setAiResult]   = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError]     = useState('')
  const abortRef = useRef<AbortController | null>(null)

  const imgFileRef = useRef<HTMLInputElement>(null)
  const contentTextareaRef = useRef<HTMLTextAreaElement>(null)
  const [uploadingImg, setUploadingImg] = useState(false)
  const [imgUploadError, setImgUploadError] = useState('')

  const slugManualRef = useRef(false)

  function handleTitleChange(val: string) {
    setTitle(val)
    if (mode === 'new' && !slugManualRef.current) setSlug(titleToSlug(val))
  }
  function handleSlugChange(val: string) {
    slugManualRef.current = true
    setSlug(val.toLowerCase().replace(/[^\w-]/g, '').replace(/-+/g, '-').slice(0, 80))
  }

  async function handleAiSlug() {
    if (!title.trim()) { setError('请先填写标题'); return }
    setSlugGenerating(true)
    try {
      const res = await fetch('/api/ai/write', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'draft',
          title,
          prompt: `根据以下文章标题，生成一个简洁的英文 URL slug（只含小写字母、数字和连字符，不超过 50 个字符，直接输出结果，不要加任何解释、引号或标点）：\n标题：${title}`,
          content: '',
        }),
      })
      if (!res.ok) { setError('AI slug 生成失败'); return }
      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let buffer = ''; let result = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n'); buffer = lines.pop() ?? ''
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const data = line.slice(6).trim()
          if (data === '[DONE]') break
          try { const json = JSON.parse(data); const delta = json.choices?.[0]?.delta?.content; if (delta) result += delta } catch { /* ignore */ }
        }
      }
      const cleaned = result.trim().toLowerCase().replace(/[^\w-]/g, '').replace(/-+/g, '-').slice(0, 80)
      if (cleaned) { setSlug(cleaned); slugManualRef.current = true }
    } catch { setError('网络错误，请重试') }
    finally { setSlugGenerating(false) }
  }

  async function handleSubmit() {
    if (!title.trim() || !content.trim()) { setError('标题和正文不能为空'); return }
    if (mode === 'new' && !slug.trim()) { setError('请填写 Slug（URL）'); return }
    setSubmitting(true); setError('')
    const postSlug = mode === 'new' ? `__new__:${slug.trim()}` : initialData!.slug
    const res = await fetch('/api/edit-requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        post_slug: postSlug, title: title.trim(), excerpt: excerpt.trim(),
        content: content.trim(), tags: tagsRaw.split(',').map(t => t.trim()).filter(Boolean),
        cover_image: coverImage.trim() || null,
        ...(fromId ? { from_id: fromId } : {}),
      }),
    })
    setSubmitting(false)
    if (!res.ok) { const d = await res.json(); setError(d.error ?? '提交失败'); return }
    setSubmitted(true)
  }

  function insertAtCursor(text: string) {
    const ta = contentTextareaRef.current
    if (!ta) { setContent(prev => prev + '\n' + text); return }
    const start = ta.selectionStart ?? content.length
    const end   = ta.selectionEnd   ?? content.length
    const before = content.slice(0, start); const after = content.slice(end)
    const newContent = before + (before && !before.endsWith('\n') ? '\n' : '') + text + '\n' + after
    setContent(newContent)
    requestAnimationFrame(() => {
      const pos = (before + (before && !before.endsWith('\n') ? '\n' : '') + text + '\n').length
      ta.setSelectionRange(pos, pos); ta.focus()
    })
  }

  async function handleImgUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return
    if (file.size > 10 * 1024 * 1024) { setImgUploadError('图片不能超过 10MB'); return }
    if (!['image/jpeg','image/png','image/webp','image/gif'].includes(file.type)) { setImgUploadError('仅支持 JPG/PNG/WebP/GIF'); return }
    setUploadingImg(true); setImgUploadError('')
    try {
      const fd = new FormData(); fd.append('file', file)
      const res = await fetch('/api/posts/image', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) { setImgUploadError(data.error ?? '上传失败'); return }
      const url: string = data.url ?? ''
      if (!url) { setImgUploadError('未获取到图片地址'); return }
      insertAtCursor(`![${file.name.replace(/\.[^.]+$/, '')}](${url})`)
    } catch { setImgUploadError('网络错误，请重试') }
    finally { setUploadingImg(false); if (imgFileRef.current) imgFileRef.current.value = '' }
  }

  async function handleCoverUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return
    if (file.size > 10 * 1024 * 1024) { setCoverUploadError('图片不能超过 10MB'); return }
    setUploadingCover(true); setCoverUploadError('')
    try {
      // 先删旧封面（如果是本次会话上传的，有 image id）
      if (coverImageId) {
        fetch(`/api/posts/image?id=${coverImageId}`, { method: 'DELETE' }).catch(() => {})
        setCoverImageId(null)
      }
      const fd = new FormData(); fd.append('file', file)
      const res = await fetch('/api/posts/image', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) { setCoverUploadError(data.error ?? '上传失败'); return }
      setCoverImage(data.url ?? '')
      if (data.id) setCoverImageId(data.id)
    } catch { setCoverUploadError('网络错误，请重试') }
    finally { setUploadingCover(false); if (coverFileRef.current) coverFileRef.current.value = '' }
  }

  async function handleAiGenerate() {
    setAiLoading(true); setAiResult(''); setAiError('')
    abortRef.current = new AbortController()
    try {
      const res = await fetch('/api/ai/write', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        signal: abortRef.current.signal,
        body: JSON.stringify({ mode: aiMode, prompt: aiPrompt, content, title }),
      })
      if (!res.ok) { const d = await res.json(); setAiError(d.error ?? 'AI 调用失败'); return }
      const reader = res.body!.getReader(); const decoder = new TextDecoder(); let buffer = ''
      while (true) {
        const { done, value } = await reader.read(); if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n'); buffer = lines.pop() ?? ''
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const data = line.slice(6).trim(); if (data === '[DONE]') break
          try { const json = JSON.parse(data); const delta = json.choices?.[0]?.delta?.content; if (delta) setAiResult(prev => prev + delta) } catch { /* ignore */ }
        }
      }
    } catch (e: any) { if (e.name !== 'AbortError') setAiError('生成失败，请重试') }
    finally { setAiLoading(false) }
  }

  function handleApply() {
    if (!aiResult) return
    if (aiMode === 'draft') setContent(aiResult)
    else if (aiMode === 'continue') setContent(prev => prev + (prev.endsWith('\n') ? '' : '\n') + aiResult)
    else if (aiMode === 'excerpt') setExcerpt(aiResult)
    setAiResult('')
  }

  // ── 提交成功 ──
  if (submitted) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center px-4">
        <div className="bg-white border border-gray-100 rounded-3xl p-10 max-w-md w-full text-center shadow-sm">
          <div className="w-14 h-14 rounded-full bg-green-50 border border-green-100 flex items-center justify-center mx-auto mb-5">
            <Send className="w-6 h-6 text-green-500" />
          </div>
          <h2 className="text-xl font-black text-gray-900 mb-2">提交成功！</h2>
          <p className="text-sm text-gray-400 mb-6 leading-relaxed">
            {mode === 'new' ? '你的新文章已提交审核，管理员审核通过后将正式发布。' : '你的编辑请求已提交，管理员审核通过后将更新文章。'}
          </p>
          <div className="flex gap-3">
            <Link href="/dashboard" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold py-2.5 rounded-xl transition-colors text-center">
              查看提交记录
            </Link>
            <button
              onClick={() => { setSubmitted(false); setTitle(''); setSlug(''); setExcerpt(''); setContent(''); setTagsRaw(''); setCoverImage(''); slugManualRef.current = false }}
              className="flex-1 border border-gray-200 hover:border-gray-400 text-gray-600 text-sm font-bold py-2.5 rounded-xl transition-colors"
            >
              再写一篇
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FAFAF8] flex flex-col">
      {/* ── Toolbar ── */}
      <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center gap-3">
        <Link href="/dashboard" className="p-2 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <h1 className="text-sm font-black text-gray-600 tracking-widest uppercase flex-1 min-w-0">
          {mode === 'new' ? '新建文章' : '编辑文章'}
          <span className="ml-2 text-[10px] font-bold text-amber-500 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md normal-case tracking-normal">
            提交后需管理员审核
          </span>
        </h1>

        {enableAi && (
          <button onClick={() => setAiOpen(v => !v)}
            className={`flex items-center gap-2 text-xs font-bold px-3 py-2 rounded-lg transition-colors ${aiOpen ? 'bg-violet-100 text-violet-700' : 'text-gray-500 hover:text-violet-600 hover:bg-violet-50'}`}>
            <Sparkles className="w-4 h-4" />AI 助手
          </button>
        )}

        <button onClick={() => { setImgUploadError(''); imgFileRef.current?.click() }} disabled={uploadingImg}
          className="flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-emerald-600 px-3 py-2 rounded-lg hover:bg-emerald-50 transition-colors disabled:opacity-50">
          {uploadingImg ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4" />}
          插图
        </button>
        <input ref={imgFileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={handleImgUpload} />

        <button onClick={() => setPreview(v => !v)}
          className="flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors">
          {preview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          {preview ? '编辑' : '预览'}
        </button>

        <button onClick={handleSubmit} disabled={submitting}
          className="flex items-center gap-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl transition-colors disabled:opacity-50">
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          提交审核
        </button>
      </header>

      {error && (
        <div className="bg-red-50 border-b border-red-100 px-6 py-3 text-sm text-red-600 font-medium flex items-center gap-2">
          ⚠ {error}
          <button onClick={() => setError('')} className="ml-auto text-red-400 hover:text-red-600">✕</button>
        </div>
      )}

      {/* ── Meta 字段 ── */}
      <div className="border-b border-gray-100 bg-white px-6 py-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 标题 */}
        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-1.5">标题</label>
          <input value={title} onChange={e => handleTitleChange(e.target.value)} placeholder="文章标题"
            className="w-full text-sm font-bold text-gray-900 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-blue-400 focus:bg-white transition" />
        </div>

        {/* Slug */}
        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-1.5">
            Slug（URL）
            {mode === 'edit' && <span className="ml-1 text-gray-300 normal-case tracking-normal font-normal">编辑时不可修改</span>}
          </label>
          <div className="flex gap-1.5">
            <input value={slug} onChange={e => handleSlugChange(e.target.value)} placeholder="url-friendly-slug"
              readOnly={mode === 'edit'}
              className={`flex-1 min-w-0 text-sm font-mono text-gray-600 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-blue-400 focus:bg-white transition ${mode === 'edit' ? 'opacity-50 cursor-not-allowed' : ''}`} />
            {/* AI 生成 slug（仅 new + enableAi） */}
            {mode === 'new' && enableAi && (
              <button onClick={handleAiSlug} disabled={slugGenerating || !title.trim()} title="AI 生成 Slug"
                className="flex-shrink-0 flex items-center gap-1 text-xs font-bold text-gray-500 hover:text-violet-600 border border-gray-200 hover:border-violet-300 bg-gray-50 hover:bg-violet-50 px-2.5 py-2 rounded-xl transition-colors disabled:opacity-40">
                {slugGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
              </button>
            )}
            {/* 规则生成（所有 new 模式都有） */}
            {mode === 'new' && (
              <button onClick={() => { setSlug(titleToSlug(title)); slugManualRef.current = true }} disabled={!title.trim()}
                className="flex-shrink-0 text-[10px] font-bold text-gray-400 hover:text-blue-600 border border-gray-200 hover:border-blue-300 bg-gray-50 hover:bg-blue-50 px-2.5 py-2 rounded-xl transition-colors disabled:opacity-40 whitespace-nowrap">
                自动生成
              </button>
            )}
          </div>
          {mode === 'new' && slug && (
            <p className="text-[10px] text-gray-400 mt-1 font-mono truncate">/blog/{slug}</p>
          )}
        </div>

        {/* 标签 */}
        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-1.5">标签（逗号分隔）</label>
          <input value={tagsRaw} onChange={e => setTagsRaw(e.target.value)} placeholder="Next.js, TypeScript, AI"
            className="w-full text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-blue-400 focus:bg-white transition" />
        </div>

        {/* 摘要 */}
        <div className="md:col-span-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-1.5">
            摘要
            {enableAi && aiMode === 'excerpt' && aiResult && !aiLoading && (
              <button onClick={handleApply} className="ml-2 text-violet-500 hover:text-violet-700 font-black text-[10px]">← 应用 AI 摘要</button>
            )}
          </label>
          <input value={excerpt} onChange={e => setExcerpt(e.target.value)} placeholder="文章摘要，显示在列表页"
            className="w-full text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-blue-400 focus:bg-white transition" />
        </div>

        {/* 封面图 */}
        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-1.5">封面图</label>
          <div className="flex gap-2 items-start">
            {coverImage ? (
              <div className="relative flex-shrink-0 w-16 h-10 rounded-lg overflow-hidden border border-gray-200 bg-gray-50 group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={coverImage} alt="封面" className="w-full h-full object-cover" />
                <button type="button" onClick={() => setCoverImage('')}
                  className="absolute inset-0 bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <div className="flex-shrink-0 w-16 h-10 rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 flex items-center justify-center">
                <ImagePlus className="w-4 h-4 text-gray-300" />
              </div>
            )}
            <div className="flex-1 min-w-0 space-y-1">
              <button type="button" onClick={() => { setCoverUploadError(''); coverFileRef.current?.click() }} disabled={uploadingCover}
                className="w-full flex items-center justify-center gap-1.5 text-xs font-bold text-gray-500 hover:text-blue-600 border border-gray-200 hover:border-blue-300 bg-gray-50 hover:bg-blue-50 px-2 py-1.5 rounded-lg transition-colors disabled:opacity-50">
                {uploadingCover ? <Loader2 className="w-3 h-3 animate-spin" /> : <ImagePlus className="w-3 h-3" />}
                {uploadingCover ? '上传中…' : '上传封面'}
              </button>
              {coverUploadError && <p className="text-[10px] text-red-500">{coverUploadError}</p>}
            </div>
            <input ref={coverFileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleCoverUpload} />
          </div>
        </div>
      </div>

      {/* ── 主编辑区 ── */}
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col overflow-hidden">
          {!preview ? (
            <>
              <textarea ref={contentTextareaRef} value={content} onChange={e => setContent(e.target.value)}
                placeholder="在这里写 Markdown 正文..."
                className="flex-1 w-full resize-none font-mono text-sm text-gray-700 leading-relaxed bg-[#FAFAF8] px-10 py-8 focus:outline-none"
                style={{ minHeight: '60vh' }} />
              {imgUploadError && (
                <div className="flex items-center gap-2 px-10 py-2 bg-red-50 border-t border-red-100 text-xs text-red-500">
                  <span>⚠ {imgUploadError}</span>
                  <button onClick={() => setImgUploadError('')} className="ml-auto text-red-400 hover:text-red-600">✕</button>
                </div>
              )}
              {uploadingImg && (
                <div className="flex items-center gap-2 px-10 py-2 bg-emerald-50 border-t border-emerald-100 text-xs text-emerald-600">
                  <Loader2 className="w-3 h-3 animate-spin" />图片上传中，请稍候…
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 max-w-[780px] mx-auto px-10 py-8 text-gray-700 leading-[1.9] overflow-y-auto">
              <h1 className="text-4xl font-black tracking-tighter text-gray-900 mb-4">{title || '（无标题）'}</h1>
              <p className="text-gray-400 text-sm mb-8 font-mono">/blog/{slug}</p>
              <pre className="whitespace-pre-wrap font-sans text-base leading-relaxed">{content}</pre>
            </div>
          )}
        </div>

        {/* ── AI 助手侧边栏 ── */}
        {enableAi && aiOpen && (
          <aside className="w-80 border-l border-gray-100 bg-white flex flex-col overflow-hidden flex-shrink-0">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <div className="flex items-center gap-2 text-sm font-black text-gray-700">
                <Sparkles className="w-4 h-4 text-violet-500" />AI 写作助手
              </div>
              <button onClick={() => setAiOpen(false)} className="text-gray-300 hover:text-gray-600 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-4 py-3 border-b border-gray-100 space-y-1.5">
              {AI_MODES.map(m => (
                <button key={m.key} onClick={() => { setAiMode(m.key); setAiResult(''); setAiError('') }}
                  className={`w-full flex items-start gap-2.5 px-3 py-2.5 rounded-xl text-left transition-colors ${aiMode === m.key ? 'bg-violet-50 text-violet-700' : 'hover:bg-gray-50 text-gray-600'}`}>
                  <span className={`mt-0.5 flex-shrink-0 ${aiMode === m.key ? 'text-violet-500' : 'text-gray-400'}`}>{m.icon}</span>
                  <div>
                    <p className="text-xs font-black">{m.label}</p>
                    <p className="text-[10px] text-gray-400 leading-tight mt-0.5">{m.desc}</p>
                  </div>
                  {aiMode === m.key && <ChevronRight className="w-3.5 h-3.5 ml-auto self-center text-violet-400 flex-shrink-0" />}
                </button>
              ))}
            </div>

            <div className="px-4 py-3 flex-shrink-0">
              {aiMode === 'draft' && (
                <textarea value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} placeholder="描述你想写的主题和要点..." rows={4}
                  className="w-full text-xs text-gray-700 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-violet-400 resize-none transition" />
              )}
              {aiMode === 'continue' && <p className="text-xs text-gray-400 bg-gray-50 rounded-xl px-3 py-2.5">将基于编辑器中的现有内容进行续写</p>}
              {aiMode === 'excerpt'  && <p className="text-xs text-gray-400 bg-gray-50 rounded-xl px-3 py-2.5">将根据文章标题和正文自动生成摘要</p>}
              {aiError && <p className="text-xs text-red-500 mt-2">{aiError}</p>}
              <div className="flex gap-2 mt-2.5">
                {aiLoading ? (
                  <button onClick={() => { abortRef.current?.abort(); setAiLoading(false) }}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-black bg-red-50 text-red-600 hover:bg-red-100 transition-colors">
                    <X className="w-3.5 h-3.5" /> 停止
                  </button>
                ) : (
                  <button onClick={handleAiGenerate}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-black bg-violet-600 hover:bg-violet-700 text-white transition-colors">
                    <Sparkles className="w-3.5 h-3.5" />{aiResult ? '重新生成' : '开始生成'}
                  </button>
                )}
                {aiResult && !aiLoading && aiMode !== 'excerpt' && (
                  <button onClick={handleApply}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-black bg-blue-600 hover:bg-blue-700 text-white transition-colors">
                    应用
                  </button>
                )}
              </div>
            </div>

            {(aiLoading || aiResult) && (
              <div className="flex-1 overflow-y-auto px-4 pb-4">
                <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 flex items-center gap-1.5">
                  {aiLoading && <Loader2 className="w-3 h-3 animate-spin text-violet-400" />}生成结果
                </div>
                <pre className="text-xs text-gray-700 whitespace-pre-wrap font-sans leading-relaxed bg-gray-50 rounded-xl p-3 min-h-[80px]">
                  {aiResult}
                  {aiLoading && <span className="inline-block w-1.5 h-3.5 bg-violet-400 animate-pulse ml-0.5 align-middle" />}
                </pre>
                {aiResult && !aiLoading && aiMode === 'excerpt' && (
                  <button onClick={handleApply} className="w-full mt-2 py-2 rounded-xl text-xs font-black bg-blue-600 hover:bg-blue-700 text-white transition-colors">
                    应用为摘要
                  </button>
                )}
              </div>
            )}
          </aside>
        )}
      </div>
    </div>
  )
}
