'use client'

// components/admin/PostEditor.tsx
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Save, Eye, EyeOff, Loader2, ArrowLeft, Sparkles, X, ChevronRight, FileText, PenLine, AlignLeft, ImagePlus } from 'lucide-react'
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

type AiMode = 'draft' | 'continue' | 'excerpt'

const AI_MODES: { key: AiMode; label: string; desc: string; icon: React.ReactNode }[] = [
  { key: 'draft',    label: '生成草稿', desc: '描述主题，AI 帮你写出完整草稿',  icon: <FileText className="w-4 h-4" /> },
  { key: 'continue', label: '续写内容', desc: '基于已有内容，AI 接着写后续段落', icon: <PenLine className="w-4 h-4" /> },
  { key: 'excerpt',  label: '生成摘要', desc: '根据正文，AI 自动生成列表页摘要', icon: <AlignLeft className="w-4 h-4" /> },
]

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

  // ── AI 助手状态 ──
  const [aiOpen, setAiOpen]     = useState(false)
  const [aiMode, setAiMode]     = useState<AiMode>('draft')
  const [aiPrompt, setAiPrompt] = useState('')
  const [aiResult, setAiResult] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError]   = useState('')
  const abortRef = useRef<AbortController | null>(null)

  // ── 图片上传插入 ──
  const imgFileRef = useRef<HTMLInputElement>(null)
  const contentTextareaRef = useRef<HTMLTextAreaElement>(null)
  const [uploadingImg, setUploadingImg] = useState(false)
  const [imgUploadError, setImgUploadError] = useState('')

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
      slug, title, excerpt, content,
      tags: tagsRaw.split(',').map(t => t.trim()).filter(Boolean),
      published: finalPublished,
    }
    const res = await fetch(
      mode === 'new' ? '/api/posts' : `/api/posts/${initialData!.slug}`,
      { method: mode === 'new' ? 'POST' : 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
    )
    setSaving(false)
    if (!res.ok) { const d = await res.json(); setError(d.error ?? '保存失败'); return }
    router.push('/admin')
    router.refresh()
  }

  // 插入文本到 textarea 光标位置
  function insertAtCursor(text: string) {
    const ta = contentTextareaRef.current
    if (!ta) {
      setContent(prev => prev + '\n' + text)
      return
    }
    const start = ta.selectionStart ?? content.length
    const end   = ta.selectionEnd   ?? content.length
    const before = content.slice(0, start)
    const after  = content.slice(end)
    const newContent = before + (before && !before.endsWith('\n') ? '\n' : '') + text + '\n' + after
    setContent(newContent)
    // 移动光标到插入内容之后
    requestAnimationFrame(() => {
      const pos = (before + (before && !before.endsWith('\n') ? '\n' : '') + text + '\n').length
      ta.setSelectionRange(pos, pos)
      ta.focus()
    })
  }

  async function handleImgUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) { setImgUploadError('图片不能超过 10MB'); return }
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowed.includes(file.type)) { setImgUploadError('仅支持 JPG/PNG/WebP/GIF'); return }

    setUploadingImg(true)
    setImgUploadError('')
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/posts/image', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) { setImgUploadError(data.error ?? '上传失败'); return }
      const url: string = data.url ?? ''
      if (!url) { setImgUploadError('未获取到图片地址'); return }
      const altName = file.name.replace(/\.[^.]+$/, '')
      insertAtCursor(`![${altName}](${url})`)
    } catch {
      setImgUploadError('网络错误，请重试')
    } finally {
      setUploadingImg(false)
      // 清空 input，以便同一文件可重复选择
      if (imgFileRef.current) imgFileRef.current.value = ''
    }
  }

  async function handleAiGenerate() {
    setAiLoading(true)
    setAiResult('')
    setAiError('')
    abortRef.current = new AbortController()

    try {
      const res = await fetch('/api/ai/write', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: abortRef.current.signal,
        body: JSON.stringify({ mode: aiMode, prompt: aiPrompt, content, title }),
      })

      if (!res.ok) {
        const d = await res.json()
        setAiError(d.error ?? 'AI 调用失败')
        return
      }

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const data = line.slice(6).trim()
          if (data === '[DONE]') break
          try {
            const json = JSON.parse(data)
            const delta = json.choices?.[0]?.delta?.content
            if (delta) setAiResult(prev => prev + delta)
          } catch { /* 忽略 */ }
        }
      }
    } catch (e: any) {
      if (e.name !== 'AbortError') setAiError('生成失败，请重试')
    } finally {
      setAiLoading(false)
    }
  }

  function handleAiStop() {
    abortRef.current?.abort()
    setAiLoading(false)
  }

  function handleApply() {
    if (!aiResult) return
    if (aiMode === 'draft') {
      setContent(aiResult)
    } else if (aiMode === 'continue') {
      setContent(prev => prev + (prev.endsWith('\n') ? '' : '\n') + aiResult)
    } else if (aiMode === 'excerpt') {
      setExcerpt(aiResult)
    }
    setAiResult('')
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
          onClick={() => setAiOpen(v => !v)}
          className={`flex items-center gap-2 text-xs font-bold px-3 py-2 rounded-lg transition-colors ${
            aiOpen ? 'bg-violet-100 text-violet-700' : 'text-gray-500 hover:text-violet-600 hover:bg-violet-50'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          AI 助手
        </button>

        {/* 图片上传插入按钮 */}
        <button
          onClick={() => { setImgUploadError(''); imgFileRef.current?.click() }}
          disabled={uploadingImg}
          title="上传图片并插入 Markdown"
          className="flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-emerald-600 px-3 py-2 rounded-lg hover:bg-emerald-50 transition-colors disabled:opacity-50"
        >
          {uploadingImg
            ? <Loader2 className="w-4 h-4 animate-spin" />
            : <ImagePlus className="w-4 h-4" />
          }
          插图
        </button>
        <input
          ref={imgFileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={handleImgUpload}
        />

        <button
          onClick={() => setPreview(v => !v)}
          className="flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          {preview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          {preview ? '编辑' : '预览'}
        </button>

        <button
          onClick={() => handleSave(false)}
          disabled={saving}
          className="flex items-center gap-2 text-xs font-bold text-gray-600 border border-gray-200 px-4 py-2 rounded-xl hover:border-gray-400 transition-colors disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          存草稿
        </button>

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
          <input value={title} onChange={e => handleTitleChange(e.target.value)} placeholder="文章标题"
            className="w-full text-sm font-bold text-gray-900 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-blue-400 focus:bg-white transition" />
        </div>
        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-1.5">Slug（URL）</label>
          <input value={slug} onChange={e => setSlug(e.target.value)} placeholder="url-friendly-slug"
            className="w-full text-sm font-mono text-gray-600 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-blue-400 focus:bg-white transition" />
        </div>
        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-1.5">标签（逗号分隔）</label>
          <input value={tagsRaw} onChange={e => setTagsRaw(e.target.value)} placeholder="Next.js, TypeScript, AI"
            className="w-full text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-blue-400 focus:bg-white transition" />
        </div>
        <div className="md:col-span-3">
          <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-1.5">
            摘要
            {aiMode === 'excerpt' && aiResult && !aiLoading && (
              <button onClick={handleApply} className="ml-2 text-violet-500 hover:text-violet-700 font-black text-[10px]">← 应用 AI 摘要</button>
            )}
          </label>
          <input value={excerpt} onChange={e => setExcerpt(e.target.value)} placeholder="文章摘要，显示在列表页"
            className="w-full text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-blue-400 focus:bg-white transition" />
        </div>
      </div>

      {/* Main area */}
      <div className="flex-1 flex overflow-hidden">

        {/* Editor / Preview */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {!preview ? (
            <>
              <textarea
                ref={contentTextareaRef}
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="在这里写 Markdown 正文..."
                className="flex-1 w-full resize-none font-mono text-sm text-gray-700 leading-relaxed bg-[#FAFAF8] px-10 py-8 focus:outline-none"
                style={{ minHeight: '60vh' }}
              />
              {imgUploadError && (
                <div className="flex items-center gap-2 px-10 py-2 bg-red-50 border-t border-red-100 text-xs text-red-500">
                  <span>⚠ {imgUploadError}</span>
                  <button onClick={() => setImgUploadError('')} className="ml-auto text-red-400 hover:text-red-600">✕</button>
                </div>
              )}
              {uploadingImg && (
                <div className="flex items-center gap-2 px-10 py-2 bg-emerald-50 border-t border-emerald-100 text-xs text-emerald-600">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  图片上传中，请稍候…
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 max-w-[780px] mx-auto px-10 py-8 text-gray-700 leading-[1.9] overflow-y-auto">
              <h1 className="text-4xl font-black tracking-tighter text-gray-900 mb-4">{title || '（无标题）'}</h1>
              <p className="text-gray-400 text-sm mb-8 font-mono">{slug}</p>
              <pre className="whitespace-pre-wrap font-sans text-base leading-relaxed">{content}</pre>
            </div>
          )}
        </div>

        {/* AI 助手侧边栏 */}
        {aiOpen && (
          <aside className="w-80 border-l border-gray-100 bg-white flex flex-col overflow-hidden flex-shrink-0">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <div className="flex items-center gap-2 text-sm font-black text-gray-700">
                <Sparkles className="w-4 h-4 text-violet-500" />
                AI 写作助手
              </div>
              <button onClick={() => setAiOpen(false)} className="text-gray-300 hover:text-gray-600 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 模式选择 */}
            <div className="px-4 py-3 border-b border-gray-100 space-y-1.5">
              {AI_MODES.map(m => (
                <button
                  key={m.key}
                  onClick={() => { setAiMode(m.key); setAiResult(''); setAiError('') }}
                  className={`w-full flex items-start gap-2.5 px-3 py-2.5 rounded-xl text-left transition-colors ${
                    aiMode === m.key ? 'bg-violet-50 text-violet-700' : 'hover:bg-gray-50 text-gray-600'
                  }`}
                >
                  <span className={`mt-0.5 flex-shrink-0 ${aiMode === m.key ? 'text-violet-500' : 'text-gray-400'}`}>{m.icon}</span>
                  <div>
                    <p className="text-xs font-black">{m.label}</p>
                    <p className="text-[10px] text-gray-400 leading-tight mt-0.5">{m.desc}</p>
                  </div>
                  {aiMode === m.key && <ChevronRight className="w-3.5 h-3.5 ml-auto self-center text-violet-400 flex-shrink-0" />}
                </button>
              ))}
            </div>

            {/* 输入区 */}
            <div className="px-4 py-3 flex-shrink-0">
              {aiMode === 'draft' && (
                <textarea
                  value={aiPrompt}
                  onChange={e => setAiPrompt(e.target.value)}
                  placeholder="描述你想写的主题和要点..."
                  rows={4}
                  className="w-full text-xs text-gray-700 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-violet-400 resize-none transition"
                />
              )}
              {aiMode === 'continue' && (
                <p className="text-xs text-gray-400 bg-gray-50 rounded-xl px-3 py-2.5">将基于编辑器中的现有内容进行续写</p>
              )}
              {aiMode === 'excerpt' && (
                <p className="text-xs text-gray-400 bg-gray-50 rounded-xl px-3 py-2.5">将根据文章标题和正文自动生成摘要</p>
              )}

              {aiError && <p className="text-xs text-red-500 mt-2">{aiError}</p>}

              <div className="flex gap-2 mt-2.5">
                {aiLoading ? (
                  <button onClick={handleAiStop}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-black bg-red-50 text-red-600 hover:bg-red-100 transition-colors">
                    <X className="w-3.5 h-3.5" /> 停止
                  </button>
                ) : (
                  <button onClick={handleAiGenerate}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-black bg-violet-600 hover:bg-violet-700 text-white transition-colors">
                    <Sparkles className="w-3.5 h-3.5" />
                    {aiResult ? '重新生成' : '开始生成'}
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

            {/* 生成结果 */}
            {(aiLoading || aiResult) && (
              <div className="flex-1 overflow-y-auto px-4 pb-4">
                <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 flex items-center gap-1.5">
                  {aiLoading && <Loader2 className="w-3 h-3 animate-spin text-violet-400" />}
                  生成结果
                </div>
                <pre className="text-xs text-gray-700 whitespace-pre-wrap font-sans leading-relaxed bg-gray-50 rounded-xl p-3 min-h-[80px]">
                  {aiResult}
                  {aiLoading && <span className="inline-block w-1.5 h-3.5 bg-violet-400 animate-pulse ml-0.5 align-middle" />}
                </pre>
                {aiResult && !aiLoading && aiMode === 'excerpt' && (
                  <button onClick={handleApply}
                    className="w-full mt-2 py-2 rounded-xl text-xs font-black bg-blue-600 hover:bg-blue-700 text-white transition-colors">
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
