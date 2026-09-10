'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useEditor } from '@tiptap/react'
import {
  Save, Eye, EyeOff, Loader2, ArrowLeft, Sparkles, ImagePlus, Paperclip,
} from 'lucide-react'
import { buildExtensions, EDITOR_PROSE_CLASS } from '@/features/editor/extensions'
import { mdToHtml } from '@/features/editor/markdown'
import type { Attachment, EditorMode, PostEditorInitialData } from '@/features/editor/types'
import { useImageUpload } from '@/features/editor/useImageUpload'
import { useEditorDialogs } from '@/features/editor/useEditorDialogs'
import { useAiWriting } from '@/features/editor/useAiWriting'
import { EditorBody, EditorErrorBar, EditorPreview } from '@/features/editor/EditorBody'
import { AiSidebar } from '@/features/editor/AiSidebar'
import { PostMetaForm } from '@/features/editor/PostMetaForm'
import { AttachmentsPanel } from './AttachmentsPanel'

interface Props {
  mode: EditorMode
  initialData?: PostEditorInitialData
}

/** 管理员文章编辑器：在共享编辑器内核上叠加附件子系统与发布流程 */
export default function AdminPostEditor({ mode, initialData }: Props) {
  const router = useRouter()
  const [saving, setSaving]       = useState(false)
  const [preview, setPreview]     = useState(false)
  const [error, setError]         = useState('')
  const [slug, setSlug]           = useState(initialData?.slug ?? '')
  const [title, setTitle]         = useState(initialData?.title ?? '')
  const [excerpt, setExcerpt]     = useState(initialData?.excerpt ?? '')
  const [tagsRaw, setTagsRaw]     = useState(initialData?.tags?.join(', ') ?? '')
  const [coverImage, setCoverImage] = useState<string>(initialData?.cover_image ?? '')
  const [previewHtml, setPreviewHtml] = useState('')

  // ── 附件 state ─────────────────────────────────────────────────
  const [attachments, setAttachments] = useState<Attachment[]>(initialData?.attachments ?? [])
  const [addAttOpen, setAddAttOpen]         = useState(false)
  const [addAttFilename, setAddAttFilename] = useState('')
  const [addAttUrl, setAddAttUrl]           = useState('')
  const [addAttError, setAddAttError]       = useState('')
  const [mdUploading, setMdUploading]       = useState(false)

  const editor = useEditor({
    immediatelyRender: false,
    extensions: buildExtensions('开始写作……，输入 / 可唤出快捷菜单'),
    content: mdToHtml(initialData?.content ?? ''),
    editorProps: { attributes: { class: EDITOR_PROSE_CLASS } },
    onUpdate: ({ editor }) => { setPreviewHtml(editor.getHTML()) },
    onCreate: ({ editor }) => { setPreviewHtml(editor.getHTML()) },
  })

  const dialogs = useEditorDialogs(editor)
  const upload = useImageUpload({ editor })
  const ai = useAiWriting({
    editor, title,
    onExcerpt: text => setExcerpt(text),
  })

  function handleTitleChange(val: string) {
    setTitle(val)
    if (mode === 'new' && !slug)
      setSlug(val.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '').slice(0, 80))
  }

  async function handleSave(pub?: boolean) {
    setSaving(true); setError('')
    const body = {
      slug, title, excerpt, content: editor?.getHTML() ?? '',
      tags: tagsRaw.split(',').map(t => t.trim()).filter(Boolean),
      published: pub !== undefined ? pub : false,
      cover_image: coverImage.trim() || null,
      attachments,
    }
    const res = await fetch(
      mode === 'new' ? '/api/posts' : `/api/posts/${initialData!.slug}`,
      { method: mode === 'new' ? 'POST' : 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
    )
    setSaving(false)
    if (!res.ok) { const d = await res.json(); setError(d.error ?? '保存失败'); return }
    router.push('/admin'); router.refresh()
  }

  // ── 添加附件（纯前端 state，无数据库/Cloudinary）────────────────
  function handleAddAttachment() {
    const filename = addAttFilename.trim()
    const url      = addAttUrl.trim()
    setAddAttError('')
    if (!filename) { setAddAttError('请填写文件名'); return }
    if (!url)      { setAddAttError('请填写链接'); return }
    if (!/^https?:\/\//i.test(url)) { setAddAttError('链接格式不正确，请以 http(s):// 开头'); return }
    setAttachments(prev => [...prev, { url, filename, size: 0 }])
    setAddAttFilename(''); setAddAttUrl(''); setAddAttOpen(false)
  }

  // ── 上传 md 文件到 Cloudinary（resource_type=raw），成功后追加到 attachments ──
  async function handleUploadMd(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = '' // 允许重复选择同一文件
    if (!file) return
    if (file.size > 10 * 1024 * 1024) { setAddAttError('文件不能超过 10MB'); return }
    setMdUploading(true); setAddAttError('')
    try {
      const fd = new FormData(); fd.append('file', file)
      const res = await fetch('/api/upload-md', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? '上传失败')
      setAttachments(prev => [...prev, { url: data.url, filename: data.filename, size: data.size }])
    } catch (err) {
      setAddAttError(err instanceof Error ? err.message : '上传失败')
    } finally {
      setMdUploading(false)
    }
  }

  function removeAttachment(index: number) {
    setAttachments(prev => prev.filter((_, i) => i !== index))
  }

  return (
    <div className="h-screen bg-[#FAFAF8] flex flex-col overflow-hidden">
      <header className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-2 min-w-0 overflow-x-auto">
        <Link href="/admin" className="p-2 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <h1 className="text-sm font-black text-gray-600 tracking-widest uppercase flex-1 min-w-0 truncate">
          {mode === 'new' ? '新建文章' : '编辑文章'}
        </h1>
        <button onClick={() => ai.setAiOpen(v => !v)}
          className={`flex-shrink-0 flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-lg transition-colors ${ai.aiOpen ? 'bg-violet-100 text-violet-700' : 'text-gray-500 hover:text-violet-600 hover:bg-violet-50'}`}>
          <Sparkles className="w-4 h-4" />AI 助手
        </button>
        <button onClick={() => { upload.setImgUploadError(''); upload.imgFileRef.current?.click() }} disabled={upload.uploadingImg}
          className="flex-shrink-0 flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-emerald-600 px-3 py-2 rounded-lg hover:bg-emerald-50 transition-colors disabled:opacity-50">
          {upload.uploadingImg ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4" />}插图
        </button>
        <input ref={upload.imgFileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={upload.handleImgUpload} />
        {/* ── 附件添加按钮 ── */}
        <button onClick={() => { setAddAttOpen(v => !v); setAddAttError('') }}
          className={`flex-shrink-0 flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-lg transition-colors ${addAttOpen ? 'bg-orange-100 text-orange-700' : 'text-gray-500 hover:text-orange-600 hover:bg-orange-50'}`}>
          <Paperclip className="w-4 h-4" />附件{attachments.length > 0 && `（${attachments.length}）`}
        </button>

        <button onClick={() => setPreview(v => !v)}
          className={`flex-shrink-0 flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-lg transition-colors ${preview ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'}`}>
          {preview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}{preview ? '关闭预览' : '分屏预览'}
        </button>
        <button onClick={() => handleSave(false)} disabled={saving}
          className="flex-shrink-0 flex items-center gap-1.5 text-xs font-bold text-gray-600 border border-gray-200 px-4 py-2 rounded-xl hover:border-gray-400 transition-colors disabled:opacity-50">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}存草稿
        </button>
        <button onClick={() => handleSave(true)} disabled={saving}
          className="flex-shrink-0 flex items-center gap-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl transition-colors disabled:opacity-50">
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}发布
        </button>
      </header>

      <EditorErrorBar error={error} />

      <PostMetaForm
        title={title} onTitleChange={handleTitleChange}
        slug={slug} onSlugChange={setSlug}
        tagsRaw={tagsRaw} onTagsChange={setTagsRaw}
        excerpt={excerpt} onExcerptChange={setExcerpt}
        excerptAction={ai.aiMode === 'excerpt' && ai.aiResult && !ai.aiLoading ? (
          <button onClick={ai.handleApply} className="ml-2 text-violet-500 hover:text-violet-700 font-black text-[10px]">← 应用 AI 摘要</button>
        ) : undefined}
        coverImage={coverImage}
        onCoverClear={() => setCoverImage('')}
        coverFileRef={upload.coverFileRef}
        onCoverFileChange={upload.handleCoverUpload}
        uploadingCover={upload.uploadingCover}
        coverUploadError={upload.coverUploadError}
        onPickCover={() => { upload.setCoverUploadError(''); upload.coverFileRef.current?.click() }}
      >
        {(attachments.length > 0 || addAttOpen || mdUploading) && (
          <AttachmentsPanel
            attachments={attachments}
            open={addAttOpen} onOpenChange={v => { setAddAttOpen(v); setAddAttError('') }}
            filename={addAttFilename} onFilenameChange={setAddAttFilename}
            url={addAttUrl} onUrlChange={setAddAttUrl}
            error={addAttError}
            onAdd={handleAddAttachment}
            onRemove={removeAttachment}
            mdUploading={mdUploading}
            onUploadMd={handleUploadMd}
          />
        )}
      </PostMetaForm>

      <div className="flex-1 flex overflow-hidden">
        <EditorBody
          editor={editor}
          dialogs={dialogs}
          uploadingImg={upload.uploadingImg}
          imgUploadError={upload.imgUploadError}
          onDismissImgError={() => upload.setImgUploadError('')}
        />
        {preview && <EditorPreview title={title} routeLabel={slug} html={previewHtml} />}

        {ai.aiOpen && <AiSidebar ai={ai} showProvider />}
      </div>
    </div>
  )
}
