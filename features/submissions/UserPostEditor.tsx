'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import { useEditor } from '@tiptap/react'
import { Send, Eye, EyeOff, Loader2, ArrowLeft, Sparkles, ImagePlus, Wand2 } from 'lucide-react'
import { buildExtensions, EDITOR_PROSE_CLASS } from '@/features/editor/extensions'
import { mdToHtml } from '@/features/editor/markdown'
import type { EditorMode } from '@/features/editor/types'
import { useImageUpload } from '@/features/editor/useImageUpload'
import { useEditorDialogs } from '@/features/editor/useEditorDialogs'
import { useAiWriting } from '@/features/editor/useAiWriting'
import { readAiStream } from '@/features/editor/ai-stream'
import { EditorBody, EditorErrorBar, EditorPreview } from '@/features/editor/EditorBody'
import { AiSidebar } from '@/features/editor/AiSidebar'
import { PostMetaForm } from '@/features/editor/PostMetaForm'

interface Props {
  mode: EditorMode
  /** AI 助手入口（含 AI slug 生成）是否可用 */
  enableAi?: boolean
  /** 从既有文章派生时的来源文章 id */
  fromId?: number | null
  initialData?: {
    slug: string; title: string; excerpt: string; content: string
    tags: string[]; cover_image?: string | null
  }
}

/** 标题转 slug：优先 ASCII 化，过短（如纯中文）则退化为 hash + 随机后缀 */
function titleToSlug(title: string): string {
  const ascii = title.toLowerCase().replace(/[\s_]+/g, '-').replace(/[^\w-]/g, '').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 80)
  if (ascii.length >= 3) return ascii
  const hash = Array.from(title).map(c => c.codePointAt(0)!.toString(36)).join('').slice(0, 12)
  return `post-${hash}-${Math.random().toString(36).slice(2, 6)}`
}

const AI_SLUG_PROMPT = (title: string) =>
  `根据以下文章标题，生成一个简洁的英文 URL slug（只含小写字母、数字和连字符，不超过 50 个字符，直接输出结果，不要加任何解释）：\n标题：${title}`

/** 用户投稿编辑器：在共享编辑器内核上叠加审核提交流程 */
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
  const slugManualRef = useRef(false)

  const editor = useEditor({
    immediatelyRender: false,
    extensions: buildExtensions('在这里写正文……，输入 / 可唤出快捷菜单'),
    content: mdToHtml(initialData?.content ?? ''),
    editorProps: { attributes: { class: EDITOR_PROSE_CLASS } },
    onUpdate: ({ editor }) => setPreviewHtml(editor.getHTML()),
    onCreate: ({ editor }) => setPreviewHtml(editor.getHTML()),
  })

  const dialogs = useEditorDialogs(editor)
  const upload = useImageUpload({
    editor,
    onCoverUploaded: data => { setCoverImage(data.url ?? ''); if (data.id) setCoverImageId(data.id) },
    deletePreviousCover: () => {
      if (!coverImageId) return
      fetch(`/api/posts/image?id=${coverImageId}`, { method: 'DELETE' }).catch(() => {})
      setCoverImageId(null)
    },
  })
  const ai = useAiWriting({ editor, title, onExcerpt: text => setExcerpt(text) })

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
        body: JSON.stringify({ mode: 'draft', title, prompt: AI_SLUG_PROMPT(title), content: '' }),
      })
      if (!res.ok) { setError('AI slug 生成失败'); return }
      const result = await readAiStream(res)
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

  function resetForNewPost() {
    setSubmitted(false); setTitle(''); setSlug(''); setExcerpt(''); setTagsRaw(''); setCoverImage('')
    slugManualRef.current = false
    editor?.commands.clearContent()
  }

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
            <button onClick={resetForNewPost}
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
          <button onClick={() => ai.setAiOpen(v => !v)}
            className={`flex items-center gap-2 text-xs font-bold px-3 py-2 rounded-lg transition-colors ${ai.aiOpen ? 'bg-violet-100 text-violet-700' : 'text-gray-500 hover:text-violet-600 hover:bg-violet-50'}`}>
            <Sparkles className="w-4 h-4" />AI 助手
          </button>
        )}
        <button onClick={() => { upload.setImgUploadError(''); upload.imgFileRef.current?.click() }} disabled={upload.uploadingImg}
          className="flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-emerald-600 px-3 py-2 rounded-lg hover:bg-emerald-50 transition-colors disabled:opacity-50">
          {upload.uploadingImg ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4" />}插图
        </button>
        <input ref={upload.imgFileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={upload.handleImgUpload} />
        <button onClick={() => setPreview(v => !v)}
          className={`flex items-center gap-2 text-xs font-bold px-3 py-2 rounded-lg transition-colors ${preview ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'}`}>
          {preview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}{preview ? '关闭预览' : '分屏预览'}
        </button>
        <button onClick={handleSubmit} disabled={submitting}
          className="flex items-center gap-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl transition-colors disabled:opacity-50">
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}提交审核
        </button>
      </header>

      <EditorErrorBar error={error} onDismiss={() => setError('')} />

      <PostMetaForm
        title={title} onTitleChange={handleTitleChange}
        slug={slug} onSlugChange={handleSlugChange}
        slugReadOnly={mode === 'edit'}
        slugActions={
          <>
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
          </>
        }
        slugHint={mode === 'new' && slug ? <p className="text-[10px] text-gray-400 mt-1 font-mono truncate">/blog/{slug}</p> : undefined}
        tagsRaw={tagsRaw} onTagsChange={setTagsRaw}
        excerpt={excerpt} onExcerptChange={setExcerpt}
        excerptAction={enableAi && ai.aiMode === 'excerpt' && ai.aiResult && !ai.aiLoading ? (
          <button onClick={ai.handleApply} className="ml-2 text-violet-500 hover:text-violet-700 font-black text-[10px]">← 应用 AI 摘要</button>
        ) : undefined}
        coverImage={coverImage}
        onCoverClear={() => setCoverImage('')}
        coverFileRef={upload.coverFileRef}
        onCoverFileChange={upload.handleCoverUpload}
        uploadingCover={upload.uploadingCover}
        coverUploadError={upload.coverUploadError}
        onPickCover={() => { upload.setCoverUploadError(''); upload.coverFileRef.current?.click() }}
      />

      <div className="flex-1 flex overflow-hidden">
        <EditorBody
          editor={editor}
          dialogs={dialogs}
          uploadingImg={upload.uploadingImg}
          imgUploadError={upload.imgUploadError}
          onDismissImgError={() => upload.setImgUploadError('')}
        />
        {preview && <EditorPreview title={title} routeLabel={`/blog/${slug}`} html={previewHtml} />}

        {enableAi && ai.aiOpen && <AiSidebar ai={ai} onApplyExcerpt={ai.handleApply} />}
      </div>
    </div>
  )
}
