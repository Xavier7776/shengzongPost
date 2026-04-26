'use client'

import { useState, useRef, useCallback } from 'react'
import {
  Send, Eye, EyeOff, Loader2, ArrowLeft, Sparkles,
  X, ChevronRight, FileText, PenLine, AlignLeft, ImagePlus, Wand2,
  Bold, Italic, Heading2, Heading3, List, ListOrdered,
  Quote, Code, Minus, Link as LinkIcon, Undo, Redo, Code2,
  Table, Youtube, Clock
} from 'lucide-react'
import Link from 'next/link'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import LinkExtension from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import { Table as TableExtension, TableRow, TableCell, TableHeader } from '@tiptap/extension-table'
import CharacterCount from '@tiptap/extension-character-count'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import { common, createLowlight } from 'lowlight'
import { Node, mergeAttributes } from '@tiptap/core'

const lowlight = createLowlight(common)

const VideoEmbed = Node.create({
  name: 'videoEmbed',
  group: 'block',
  atom: true,
  addAttributes() {
    return {
      src: { default: null },
      provider: { default: 'youtube' },
    }
  },
  parseHTML() { return [{ tag: 'div[data-video-embed]' }] },
  renderHTML({ HTMLAttributes }) {
    const { src, provider } = HTMLAttributes
    const raw = src ?? ''
    let iframeSrc = raw
    if (provider === 'bilibili') {
      const bvMatch = raw.match(/BV[\w]+/)
      iframeSrc = bvMatch ? `https://player.bilibili.com/player.html?bvid=${bvMatch[0]}&autoplay=0` : raw
    } else {
      const ytMatch = raw.match(/(?:v=|youtu\.be\/)([\w-]{11})/)
      iframeSrc = ytMatch ? `https://www.youtube.com/embed/${ytMatch[1]}` : raw
    }
    return ['div', mergeAttributes({ 'data-video-embed': '' }, { 'data-src': src, 'data-provider': provider }, {
      class: 'video-embed-wrapper'
    }),
      ['iframe', { src: iframeSrc, allowfullscreen: 'true', frameborder: '0', allow: 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture' }]
    ]
  },
})

interface Props {
  mode: 'new' | 'edit'
  enableAi?: boolean
  fromId?: number | null
  initialData?: {
    slug: string; title: string; excerpt: string; content: string
    tags: string[]; cover_image?: string | null
  }
}
type AiMode = 'draft' | 'continue' | 'excerpt'

const AI_MODES: { key: AiMode; label: string; desc: string; icon: React.ReactNode }[] = [
  { key: 'draft',    label: '生成草稿', desc: '描述主题，AI 帮你写出完整草稿',  icon: <FileText className="w-4 h-4" /> },
  { key: 'continue', label: '续写内容', desc: '基于已有内容，AI 接着写后续段落', icon: <PenLine  className="w-4 h-4" /> },
  { key: 'excerpt',  label: '生成摘要', desc: '根据正文，AI 自动生成列表页摘要', icon: <AlignLeft className="w-4 h-4" /> },
]

function titleToSlug(title: string): string {
  const ascii = title.toLowerCase().replace(/[\s_]+/g, '-').replace(/[^\w-]/g, '').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 80)
  if (ascii.length >= 3) return ascii
  const hash = Array.from(title).map(c => c.codePointAt(0)!.toString(36)).join('').slice(0, 12)
  return `post-${hash}-${Math.random().toString(36).slice(2, 6)}`
}

function mdToHtml(md: string): string {
  if (!md || md.trim().startsWith('<')) return md
  return md
    .replace(/^### (.+)$/gm, '<h3>$1</h3>').replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^> (.+)$/gm, '<blockquote><p>$1</p></blockquote>')
    .replace(/^- (.+)$/gm, '<li>$1</li>').replace(/(<li>.*<\/li>\n?)+/g, s => `<ul>${s}</ul>`)
    .replace(/```[\w]*\n([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
    .replace(/`([^`]+)`/g, '<code>$1</code>').replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" />').replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    .replace(/^(?!<[hupboa]|<li|<pre|<block)(.+)$/gm, '<p>$1</p>').replace(/\n{2,}/g, '')
}

export default function UserPostEditor({ mode, enableAi = false, fromId, initialData }: Props) {
  const [submitting, setSubmitting]   = useState(false)
  const [preview, setPreview]         = useState(false)
  const [error, setError]             = useState('')
  const [submitted, setSubmitted]     = useState(false)
  const [slug, setSlug]               = useState(initialData?.slug ?? '')
  const [title, setTitle]             = useState(initialData?.title ?? '')
  const [excerpt, setExcerpt]         = useState(initialData?.excerpt ?? '')
  const [tagsRaw, setTagsRaw]         = useState(initialData?.tags?.join(', ') ?? '')
  const [coverImage, setCoverImage]   = useState<string>(initialData?.cover_image ?? '')
  const [coverImageId, setCoverImageId] = useState<number | null>(null)
  const [slugGenerating, setSlugGenerating] = useState(false)
  const [previewHtml, setPreviewHtml] = useState('')

  const coverFileRef   = useRef<HTMLInputElement>(null)
  const [uploadingCover, setUploadingCover]     = useState(false)
  const [coverUploadError, setCoverUploadError] = useState('')
  const [aiOpen, setAiOpen]       = useState(false)
  const [aiMode, setAiMode]       = useState<AiMode>('draft')
  const [aiPrompt, setAiPrompt]   = useState('')
  const [aiResult, setAiResult]   = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError]     = useState('')
  const abortRef   = useRef<AbortController | null>(null)
  const imgFileRef = useRef<HTMLInputElement>(null)
  const [uploadingImg, setUploadingImg]     = useState(false)
  const [imgUploadError, setImgUploadError] = useState('')
  const slugManualRef = useRef(false)

  // ── 内联弹窗 state ──────────────────────────────────────────────
  const [linkOpen, setLinkOpen]   = useState(false)
  const [linkUrl, setLinkUrl]     = useState('')
  const [linkText, setLinkText]   = useState('')

  const [tableOpen, setTableOpen] = useState(false)
  const [tableRows, setTableRows] = useState(3)
  const [tableCols, setTableCols] = useState(3)
  const [tableHeader, setTableHeader] = useState(true)

  const [imgUrlOpen, setImgUrlOpen] = useState(false)
  const [imgUrl, setImgUrl]         = useState('')
  const [imgAlt, setImgAlt]         = useState('')

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] }, codeBlock: false }),
      Image.configure({ HTMLAttributes: { class: 'rounded-2xl max-w-full shadow-md my-6' } }),
      LinkExtension.configure({ openOnClick: false, HTMLAttributes: { class: 'text-blue-600 underline underline-offset-2' } }),
      Placeholder.configure({ placeholder: '在这里写正文……，输入 / 可唤出快捷菜单' }),
      TableExtension.configure({ resizable: false }),
      TableRow,
      TableCell,
      TableHeader,
      CharacterCount,
      CodeBlockLowlight.configure({ lowlight }),
      VideoEmbed,
    ],
    content: mdToHtml(initialData?.content ?? ''),
    editorProps: { attributes: { class: 'focus:outline-none min-h-[60vh] px-10 py-8' } },
    onUpdate: ({ editor }) => setPreviewHtml(editor.getHTML()),
    onCreate: ({ editor }) => setPreviewHtml(editor.getHTML()),
  })

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
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'draft', title, prompt: `根据以下文章标题，生成一个简洁的英文 URL slug（只含小写字母、数字和连字符，不超过 50 个字符，直接输出结果，不要加任何解释）：\n标题：${title}`, content: '' }),
      })
      if (!res.ok) { setError('AI slug 生成失败'); return }
      const reader = res.body!.getReader(); const decoder = new TextDecoder(); let buffer = ''; let result = ''
      while (true) {
        const { done, value } = await reader.read(); if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n'); buffer = lines.pop() ?? ''
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const data = line.slice(6).trim(); if (data === '[DONE]') break
          try { const delta = JSON.parse(data).choices?.[0]?.delta?.content; if (delta) result += delta } catch {}
        }
      }
      const cleaned = result.trim().toLowerCase().replace(/[^\w-]/g, '').replace(/-+/g, '-').slice(0, 80)
      if (cleaned) { setSlug(cleaned); slugManualRef.current = true }
    } catch { setError('网络错误，请重试') }
    finally { setSlugGenerating(false) }
  }

  async function handleSubmit() {
    const content = editor?.getHTML() ?? ''
    if (!title.trim() || !content.trim() || content === '<p></p>') { setError('标题和正文不能为空'); return }
    if (mode === 'new' && !slug.trim()) { setError('请填写 Slug（URL）'); return }
    setSubmitting(true); setError('')
    const postSlug = mode === 'new' ? `__new__:${slug.trim()}` : initialData!.slug
    const res = await fetch('/api/edit-requests', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
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
      editor?.chain().focus().setImage({ src: data.url, alt: file.name.replace(/\.[^.]+$/, '') }).run()
    } catch { setImgUploadError('网络错误，请重试') }
    finally { setUploadingImg(false); if (imgFileRef.current) imgFileRef.current.value = '' }
  }

  async function handleCoverUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return
    setUploadingCover(true); setCoverUploadError('')
    try {
      if (coverImageId) { fetch(`/api/posts/image?id=${coverImageId}`, { method: 'DELETE' }).catch(() => {}); setCoverImageId(null) }
      const fd = new FormData(); fd.append('file', file)
      const res = await fetch('/api/posts/image', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) { setCoverUploadError(data.error ?? '上传失败'); return }
      setCoverImage(data.url ?? ''); if (data.id) setCoverImageId(data.id)
    } catch { setCoverUploadError('网络错误，请重试') }
    finally { setUploadingCover(false); if (coverFileRef.current) coverFileRef.current.value = '' }
  }

  const openLinkPopup = useCallback(() => {
    const { from, to, empty } = editor?.state.selection ?? { from:0, to:0, empty:true }
    setLinkText(empty ? '' : editor?.state.doc.textBetween(from, to) ?? '')
    setLinkUrl(editor?.getAttributes('link').href ?? '')
    setLinkOpen(true)
  }, [editor])

  const applyLink = useCallback(() => {
    if (!linkUrl) { editor?.chain().focus().unsetLink().run(); setLinkOpen(false); return }
    let chain = editor?.chain().focus()
    if (linkText) chain = chain?.insertContent(`<a href="${linkUrl}">${linkText}</a>`)
    else chain = chain?.setLink({ href: linkUrl })
    chain?.run()
    setLinkOpen(false); setLinkUrl(''); setLinkText('')
  }, [editor, linkUrl, linkText])

  const applyTable = useCallback(() => {
    editor?.chain().focus().insertTable({ rows: tableRows, cols: tableCols, withHeaderRow: tableHeader }).run()
    setTableOpen(false)
  }, [editor, tableRows, tableCols, tableHeader])

  const applyImgUrl = useCallback(() => {
    if (!imgUrl) { setImgUrlOpen(false); return }
    editor?.chain().focus().setImage({ src: imgUrl, alt: imgAlt || undefined }).run()
    setImgUrlOpen(false); setImgUrl(''); setImgAlt('')
  }, [editor, imgUrl, imgAlt])

  const handleInsertVideo = useCallback(() => {
    const url = window.prompt('粘贴 YouTube 或 Bilibili 链接')
    if (!url) return
    const provider = url.includes('bilibili') ? 'bilibili' : 'youtube'
    editor?.chain().focus().insertContent({ type: 'videoEmbed', attrs: { src: url, provider } }).run()
  }, [editor])

  async function handleAiGenerate() {
    setAiLoading(true); setAiResult(''); setAiError('')
    abortRef.current = new AbortController()
    try {
      const res = await fetch('/api/ai/write', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        signal: abortRef.current.signal,
        body: JSON.stringify({ mode: aiMode, prompt: aiPrompt, content: editor?.getHTML() ?? '', title }),
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
          try { const delta = JSON.parse(data).choices?.[0]?.delta?.content; if (delta) setAiResult(p => p + delta) } catch {}
        }
      }
    } catch (e: any) { if (e.name !== 'AbortError') setAiError('生成失败，请重试') }
    finally { setAiLoading(false) }
  }

  function handleApply() {
    if (!aiResult) return
    if (aiMode === 'draft') editor?.commands.setContent(aiResult)
    else if (aiMode === 'continue') editor?.commands.insertContentAt(editor.state.doc.content.size, aiResult)
    else if (aiMode === 'excerpt') setExcerpt(aiResult)
    setAiResult('')
  }

  const TB = ({ onClick, active, disabled, title, children }: {
    onClick: () => void; active?: boolean; disabled?: boolean; title: string; children: React.ReactNode
  }) => (
    <button type="button" onMouseDown={e => { e.preventDefault(); onClick() }} disabled={disabled} title={title}
      className={`p-1.5 rounded-lg transition-colors ${active ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'} disabled:opacity-30`}>
      {children}
    </button>
  )

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
            <button onClick={() => { setSubmitted(false); setTitle(''); setSlug(''); setExcerpt(''); setTagsRaw(''); setCoverImage(''); slugManualRef.current = false; editor?.commands.clearContent() }}
              className="flex-1 border border-gray-200 hover:border-gray-400 text-gray-600 text-sm font-bold py-2.5 rounded-xl transition-colors">
              再写一篇
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FAFAF8] flex flex-col">
      <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center gap-3">
        <Link href="/dashboard" className="p-2 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <h1 className="text-sm font-black text-gray-600 tracking-widest uppercase flex-1 min-w-0">
          {mode === 'new' ? '新建文章' : '编辑文章'}
          <span className="ml-2 text-[10px] font-bold text-amber-500 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md normal-case tracking-normal">提交后需管理员审核</span>
        </h1>
        {enableAi && (
          <button onClick={() => setAiOpen(v => !v)}
            className={`flex items-center gap-2 text-xs font-bold px-3 py-2 rounded-lg transition-colors ${aiOpen ? 'bg-violet-100 text-violet-700' : 'text-gray-500 hover:text-violet-600 hover:bg-violet-50'}`}>
            <Sparkles className="w-4 h-4" />AI 助手
          </button>
        )}
        <button onClick={() => { setImgUploadError(''); imgFileRef.current?.click() }} disabled={uploadingImg}
          className="flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-emerald-600 px-3 py-2 rounded-lg hover:bg-emerald-50 transition-colors disabled:opacity-50">
          {uploadingImg ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4" />}插图
        </button>
        <input ref={imgFileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={handleImgUpload} />
        <button onClick={() => setPreview(v => !v)}
          className={`flex items-center gap-2 text-xs font-bold px-3 py-2 rounded-lg transition-colors ${preview ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'}`}>
          {preview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}{preview ? '关闭预览' : '分屏预览'}
        </button>
        <button onClick={handleSubmit} disabled={submitting}
          className="flex items-center gap-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl transition-colors disabled:opacity-50">
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}提交审核
        </button>
      </header>

      {error && (
        <div className="bg-red-50 border-b border-red-100 px-6 py-3 text-sm text-red-600 font-medium flex items-center gap-2">
          ⚠ {error}<button onClick={() => setError('')} className="ml-auto text-red-400 hover:text-red-600">✕</button>
        </div>
      )}

      <div className="border-b border-gray-100 bg-white px-6 py-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-1.5">标题</label>
          <input value={title} onChange={e => handleTitleChange(e.target.value)} placeholder="文章标题"
            className="w-full text-sm font-bold text-gray-900 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-blue-400 focus:bg-white transition" />
        </div>
        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-1.5">
            Slug（URL）{mode === 'edit' && <span className="ml-1 text-gray-300 normal-case tracking-normal font-normal">编辑时不可修改</span>}
          </label>
          <div className="flex gap-1.5">
            <input value={slug} onChange={e => handleSlugChange(e.target.value)} placeholder="url-friendly-slug" readOnly={mode === 'edit'}
              className={`flex-1 min-w-0 text-sm font-mono text-gray-600 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-blue-400 focus:bg-white transition ${mode === 'edit' ? 'opacity-50 cursor-not-allowed' : ''}`} />
            {mode === 'new' && enableAi && (
              <button onClick={handleAiSlug} disabled={slugGenerating || !title.trim()} title="AI 生成 Slug"
                className="flex-shrink-0 flex items-center gap-1 text-xs font-bold text-gray-500 hover:text-violet-600 border border-gray-200 hover:border-violet-300 bg-gray-50 hover:bg-violet-50 px-2.5 py-2 rounded-xl transition-colors disabled:opacity-40">
                {slugGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
              </button>
            )}
            {mode === 'new' && (
              <button onClick={() => { setSlug(titleToSlug(title)); slugManualRef.current = true }} disabled={!title.trim()}
                className="flex-shrink-0 text-[10px] font-bold text-gray-400 hover:text-blue-600 border border-gray-200 hover:border-blue-300 bg-gray-50 hover:bg-blue-50 px-2.5 py-2 rounded-xl transition-colors disabled:opacity-40 whitespace-nowrap">
                自动生成
              </button>
            )}
          </div>
          {mode === 'new' && slug && <p className="text-[10px] text-gray-400 mt-1 font-mono truncate">/blog/{slug}</p>}
        </div>
        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-1.5">标签（逗号分隔）</label>
          <input value={tagsRaw} onChange={e => setTagsRaw(e.target.value)} placeholder="Next.js, TypeScript, AI"
            className="w-full text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-blue-400 focus:bg-white transition" />
        </div>
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
        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-1.5">封面图</label>
          <div className="flex gap-2 items-start">
            {coverImage ? (
              <div className="relative flex-shrink-0 w-16 h-10 rounded-lg overflow-hidden border border-gray-200 group">
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

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex overflow-hidden">
          {/* 编辑器列 */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="relative bg-white border-b border-gray-100 px-6 py-2 flex items-center gap-0.5 flex-wrap">
              <TB onClick={() => editor?.chain().focus().undo().run()} title="撤销 Ctrl+Z" disabled={!editor?.can().undo()}><Undo className="w-4 h-4" /></TB>
              <TB onClick={() => editor?.chain().focus().redo().run()} title="重做 Ctrl+Y" disabled={!editor?.can().redo()}><Redo className="w-4 h-4" /></TB>
              <div className="w-px h-5 bg-gray-200 mx-1.5" />
              <TB onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()} title="二级标题" active={editor?.isActive('heading', { level: 2 })}><Heading2 className="w-4 h-4" /></TB>
              <TB onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()} title="三级标题" active={editor?.isActive('heading', { level: 3 })}><Heading3 className="w-4 h-4" /></TB>
              <div className="w-px h-5 bg-gray-200 mx-1.5" />
              <TB onClick={() => editor?.chain().focus().toggleBold().run()} title="加粗 Ctrl+B" active={editor?.isActive('bold')}><Bold className="w-4 h-4" /></TB>
              <TB onClick={() => editor?.chain().focus().toggleItalic().run()} title="斜体 Ctrl+I" active={editor?.isActive('italic')}><Italic className="w-4 h-4" /></TB>
              <TB onClick={() => editor?.chain().focus().toggleCode().run()} title="行内代码" active={editor?.isActive('code')}><Code className="w-4 h-4" /></TB>
              <div className="w-px h-5 bg-gray-200 mx-1.5" />
              <TB onClick={() => editor?.chain().focus().toggleBulletList().run()} title="无序列表" active={editor?.isActive('bulletList')}><List className="w-4 h-4" /></TB>
              <TB onClick={() => editor?.chain().focus().toggleOrderedList().run()} title="有序列表" active={editor?.isActive('orderedList')}><ListOrdered className="w-4 h-4" /></TB>
              <TB onClick={() => editor?.chain().focus().toggleBlockquote().run()} title="引用块" active={editor?.isActive('blockquote')}><Quote className="w-4 h-4" /></TB>
              <TB onClick={() => editor?.chain().focus().toggleCodeBlock().run()} title="代码块" active={editor?.isActive('codeBlock')}><Code2 className="w-4 h-4" /></TB>
              <div className="w-px h-5 bg-gray-200 mx-1.5" />
              <TB onClick={openLinkPopup} title="插入链接" active={editor?.isActive('link')}><LinkIcon className="w-4 h-4" /></TB>
              <TB onClick={() => editor?.chain().focus().setHorizontalRule().run()} title="水平分隔线"><Minus className="w-4 h-4" /></TB>
              <div className="w-px h-5 bg-gray-200 mx-1.5" />
              <TB onClick={() => setTableOpen(v => !v)} title="插入表格" active={editor?.isActive('table') || tableOpen}><Table className="w-4 h-4" /></TB>
              <TB onClick={() => setImgUrlOpen(v => !v)} title="插入图片 URL"><ImagePlus className="w-4 h-4" /></TB>
              <TB onClick={handleInsertVideo} title="嵌入视频 (YouTube / Bilibili)"><Youtube className="w-4 h-4" /></TB>

              {/* ── 链接弹窗 ── */}
              {linkOpen && (
                <div className="absolute top-full left-0 mt-1 z-50 bg-white border border-gray-200 rounded-2xl shadow-xl p-4 w-80"
                  onKeyDown={e => { if (e.key === 'Enter') applyLink(); if (e.key === 'Escape') setLinkOpen(false) }}>
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">插入链接</p>
                  <input autoFocus value={linkUrl} onChange={e => setLinkUrl(e.target.value)}
                    placeholder="https://example.com"
                    className="w-full text-sm bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 mb-2 focus:outline-none focus:border-blue-400 focus:bg-white transition" />
                  <input value={linkText} onChange={e => setLinkText(e.target.value)}
                    placeholder="显示文字（留空则包裹选区）"
                    className="w-full text-sm bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 mb-3 focus:outline-none focus:border-blue-400 focus:bg-white transition" />
                  <div className="flex gap-2">
                    <button onClick={applyLink}
                      className="flex-1 text-xs font-black bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-xl transition">确认</button>
                    {editor?.isActive('link') && (
                      <button onClick={() => { editor.chain().focus().unsetLink().run(); setLinkOpen(false) }}
                        className="text-xs font-black text-red-500 hover:text-red-700 px-3 py-2 rounded-xl hover:bg-red-50 transition">移除</button>
                    )}
                    <button onClick={() => setLinkOpen(false)}
                      className="text-xs font-black text-gray-400 hover:text-gray-600 px-3 py-2 rounded-xl hover:bg-gray-100 transition">取消</button>
                  </div>
                </div>
              )}

              {/* ── 表格弹窗 ── */}
              {tableOpen && (
                <div className="absolute top-full left-0 mt-1 z-50 bg-white border border-gray-200 rounded-2xl shadow-xl p-4 w-64"
                  onKeyDown={e => { if (e.key === 'Enter') applyTable(); if (e.key === 'Escape') setTableOpen(false) }}>
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">插入表格</p>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="text-[10px] text-gray-400 font-bold block mb-1">行数</label>
                      <input type="number" min={1} max={20} value={tableRows} onChange={e => setTableRows(Number(e.target.value))}
                        className="w-full text-sm bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-blue-400 focus:bg-white transition" />
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-400 font-bold block mb-1">列数</label>
                      <input type="number" min={1} max={10} value={tableCols} onChange={e => setTableCols(Number(e.target.value))}
                        className="w-full text-sm bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-blue-400 focus:bg-white transition" />
                    </div>
                  </div>
                  <label className="flex items-center gap-2 text-xs text-gray-600 mb-3 cursor-pointer">
                    <input type="checkbox" checked={tableHeader} onChange={e => setTableHeader(e.target.checked)}
                      className="w-3.5 h-3.5 accent-blue-600" />
                    包含表头行
                  </label>
                  <div className="flex gap-2">
                    <button onClick={applyTable}
                      className="flex-1 text-xs font-black bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-xl transition">插入</button>
                    <button onClick={() => setTableOpen(false)}
                      className="text-xs font-black text-gray-400 hover:text-gray-600 px-3 py-2 rounded-xl hover:bg-gray-100 transition">取消</button>
                  </div>
                </div>
              )}

              {/* ── 图片 URL 弹窗 ── */}
              {imgUrlOpen && (
                <div className="absolute top-full left-0 mt-1 z-50 bg-white border border-gray-200 rounded-2xl shadow-xl p-4 w-80"
                  onKeyDown={e => { if (e.key === 'Enter') applyImgUrl(); if (e.key === 'Escape') setImgUrlOpen(false) }}>
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">插入图片</p>
                  <input autoFocus value={imgUrl} onChange={e => setImgUrl(e.target.value)}
                    placeholder="图片 URL（https://...）"
                    className="w-full text-sm bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 mb-2 focus:outline-none focus:border-blue-400 focus:bg-white transition" />
                  <input value={imgAlt} onChange={e => setImgAlt(e.target.value)}
                    placeholder="Alt 描述（可选）"
                    className="w-full text-sm bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 mb-1 focus:outline-none focus:border-blue-400 focus:bg-white transition" />
                  <p className="text-[10px] text-gray-400 mb-3">或使用顶部「插图」按钮上传本地文件</p>
                  <div className="flex gap-2">
                    <button onClick={applyImgUrl}
                      className="flex-1 text-xs font-black bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-xl transition">插入</button>
                    <button onClick={() => setImgUrlOpen(false)}
                      className="text-xs font-black text-gray-400 hover:text-gray-600 px-3 py-2 rounded-xl hover:bg-gray-100 transition">取消</button>
                  </div>
                </div>
              )}
            </div>
            <div className="flex-1 overflow-y-auto bg-[#FAFAF8]">
              <EditorContent editor={editor} />
            </div>
            {/* 字数统计栏 */}
            {editor && (
              <div className="flex items-center gap-4 px-10 py-2 border-t border-gray-100 bg-white text-[11px] text-gray-400 font-mono">
                <span>{editor.storage.characterCount.characters()} 字</span>
                <span className="w-px h-3 bg-gray-200" />
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  约 {Math.max(1, Math.ceil(editor.storage.characterCount.characters() / 300))} 分钟阅读
                </span>
              </div>
            )}
            {imgUploadError && (
              <div className="flex items-center gap-2 px-10 py-2 bg-red-50 border-t border-red-100 text-xs text-red-500">
                <span>⚠ {imgUploadError}</span><button onClick={() => setImgUploadError('')} className="ml-auto text-red-400 hover:text-red-600">✕</button>
              </div>
            )}
            {uploadingImg && (
              <div className="flex items-center gap-2 px-10 py-2 bg-emerald-50 border-t border-emerald-100 text-xs text-emerald-600">
                <Loader2 className="w-3 h-3 animate-spin" />图片上传中，请稍候…
              </div>
            )}
          </div>

          {/* 分屏预览列 */}
          {preview && (
            <div className="w-[45%] border-l border-gray-100 bg-white flex flex-col overflow-hidden flex-shrink-0">
              <div className="px-6 py-2.5 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
                <Eye className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">实时预览</span>
              </div>
              <div className="flex-1 overflow-y-auto px-8 py-8">
                <h1 className="text-3xl font-black tracking-tighter text-gray-900 mb-2">{title || '（无标题）'}</h1>
                <p className="text-gray-300 text-xs mb-6 font-mono">/blog/{slug}</p>
                <div className="preview-content" dangerouslySetInnerHTML={{ __html: previewHtml }} />
              </div>
            </div>
          )}
        </div>

        {/* AI 助手侧边栏 */}
        {enableAi && aiOpen && (
          <aside className="w-80 border-l border-gray-100 bg-white flex flex-col overflow-hidden flex-shrink-0">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <div className="flex items-center gap-2 text-sm font-black text-gray-700">
                <Sparkles className="w-4 h-4 text-violet-500" />AI 写作助手
              </div>
              <button onClick={() => setAiOpen(false)} className="text-gray-300 hover:text-gray-600 transition-colors"><X className="w-4 h-4" /></button>
            </div>
            <div className="px-4 py-3 border-b border-gray-100 space-y-1.5">
              {AI_MODES.map(m => (
                <button key={m.key} onClick={() => { setAiMode(m.key); setAiResult(''); setAiError('') }}
                  className={`w-full flex items-start gap-2.5 px-3 py-2.5 rounded-xl text-left transition-colors ${aiMode === m.key ? 'bg-violet-50 text-violet-700' : 'hover:bg-gray-50 text-gray-600'}`}>
                  <span className={`mt-0.5 flex-shrink-0 ${aiMode === m.key ? 'text-violet-500' : 'text-gray-400'}`}>{m.icon}</span>
                  <div><p className="text-xs font-black">{m.label}</p><p className="text-[10px] text-gray-400 leading-tight mt-0.5">{m.desc}</p></div>
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
                    <X className="w-3.5 h-3.5" />停止
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
                    插入编辑器
                  </button>
                )}
              </div>
            </div>
            {(aiLoading || aiResult) && (
              <div className="flex-1 overflow-y-auto px-4 pb-4 flex flex-col gap-3">
                <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-1.5 pt-1">
                  {aiLoading && <Loader2 className="w-3 h-3 animate-spin text-violet-400" />}
                  生成结果 {aiLoading && <span className="text-violet-400 normal-case tracking-normal font-normal">· 生成中…</span>}
                </div>
                {aiMode !== 'excerpt' ? (
                  <div className="border border-gray-100 rounded-xl overflow-hidden">
                    <div className="bg-gray-50 px-3 py-1.5 border-b border-gray-100">
                      <span className="text-[9px] font-black uppercase tracking-widest text-gray-300">渲染预览</span>
                    </div>
                    <div className="p-3 max-h-[300px] overflow-y-auto">
                      <div className="ai-preview text-xs" dangerouslySetInnerHTML={{ __html: aiResult + (aiLoading ? '<span class="ai-cursor"></span>' : '') }} />
                    </div>
                  </div>
                ) : (
                  <pre className="text-xs text-gray-700 whitespace-pre-wrap font-sans leading-relaxed bg-gray-50 rounded-xl p-3 min-h-[60px]">
                    {aiResult}{aiLoading && <span className="inline-block w-1.5 h-3.5 bg-violet-400 animate-pulse ml-0.5 align-middle" />}
                  </pre>
                )}
                {aiResult && !aiLoading && (
                  <button onClick={handleApply} className="w-full py-2.5 rounded-xl text-xs font-black bg-blue-600 hover:bg-blue-700 text-white transition-colors">
                    {aiMode === 'excerpt' ? '应用为摘要' : '插入到编辑器'}
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