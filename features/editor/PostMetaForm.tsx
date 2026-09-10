'use client'

import { ImagePlus, Loader2, X } from 'lucide-react'

interface Props {
  title: string
  onTitleChange: (v: string) => void
  slug: string
  onSlugChange: (v: string) => void
  slugReadOnly?: boolean
  /** slug 输入框右侧的附加控件（AI 生成 / 自动生成按钮） */
  slugActions?: React.ReactNode
  /** slug 输入框下方的提示（如 /blog/xxx） */
  slugHint?: React.ReactNode
  tagsRaw: string
  onTagsChange: (v: string) => void
  excerpt: string
  onExcerptChange: (v: string) => void
  /** 摘要标签右侧的「应用 AI 摘要」入口 */
  excerptAction?: React.ReactNode
  coverImage: string
  onCoverClear: () => void
  coverFileRef: React.RefObject<HTMLInputElement>
  onCoverFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  uploadingCover: boolean
  coverUploadError: string
  onPickCover: () => void
  /** 附加在网格末尾的自定义区块（如管理员的附件区），占满三列 */
  children?: React.ReactNode
}

const inputCls = 'w-full text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-blue-400 focus:bg-white transition'
const labelCls = 'text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-1.5'

/** 文章元数据表单：标题 / Slug / 标签 / 摘要 / 封面图 */
export function PostMetaForm({
  title, onTitleChange,
  slug, onSlugChange, slugReadOnly, slugActions, slugHint,
  tagsRaw, onTagsChange,
  excerpt, onExcerptChange, excerptAction,
  coverImage, onCoverClear, coverFileRef, onCoverFileChange, uploadingCover, coverUploadError, onPickCover,
  children,
}: Props) {
  return (
    <div className="flex-shrink-0 border-b border-gray-100 bg-white px-6 py-4 grid grid-cols-1 md:grid-cols-3 gap-4">
      <div>
        <label className={labelCls}>标题</label>
        <input value={title} onChange={e => onTitleChange(e.target.value)} placeholder="文章标题"
          className={`${inputCls} font-bold text-gray-900`} />
      </div>
      <div>
        <label className={labelCls}>Slug（URL）{slugReadOnly && <span className="ml-1 text-gray-300 normal-case tracking-normal font-normal">编辑时不可修改</span>}</label>
        <div className="flex gap-1.5">
          <input value={slug} onChange={e => onSlugChange(e.target.value)} placeholder="url-friendly-slug" readOnly={slugReadOnly}
            className={`flex-1 min-w-0 text-sm font-mono text-gray-600 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-blue-400 focus:bg-white transition ${slugReadOnly ? 'opacity-50 cursor-not-allowed' : ''}`} />
          {slugActions}
        </div>
        {slugHint}
      </div>
      <div>
        <label className={labelCls}>标签（逗号分隔）</label>
        <input value={tagsRaw} onChange={e => onTagsChange(e.target.value)} placeholder="Next.js, TypeScript, AI" className={inputCls} />
      </div>
      <div className="md:col-span-2">
        <label className={labelCls}>摘要{excerptAction}</label>
        <input value={excerpt} onChange={e => onExcerptChange(e.target.value)} placeholder="文章摘要，显示在列表页" className={inputCls} />
      </div>
      <div>
        <label className={labelCls}>封面图</label>
        <div className="flex gap-2 items-start">
          {coverImage ? (
            <div className="relative flex-shrink-0 w-16 h-10 rounded-lg overflow-hidden border border-gray-200 group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={coverImage} alt="封面" className="w-full h-full object-cover" />
              <button type="button" onClick={onCoverClear}
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
            <button type="button" onClick={onPickCover} disabled={uploadingCover}
              className="w-full flex items-center justify-center gap-1.5 text-xs font-bold text-gray-500 hover:text-blue-600 border border-gray-200 hover:border-blue-300 bg-gray-50 hover:bg-blue-50 px-2 py-1.5 rounded-lg transition-colors disabled:opacity-50">
              {uploadingCover ? <Loader2 className="w-3 h-3 animate-spin" /> : <ImagePlus className="w-3 h-3" />}
              {uploadingCover ? '上传中…' : '上传封面'}
            </button>
            {coverUploadError && <p className="text-[10px] text-red-500">{coverUploadError}</p>}
          </div>
          <input ref={coverFileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={onCoverFileChange} />
        </div>
      </div>
      {children}
    </div>
  )
}
