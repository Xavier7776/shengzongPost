'use client'

import { Clock, Eye, Loader2 } from 'lucide-react'
import { EditorContent } from '@tiptap/react'
import type { Editor } from '@tiptap/react'
import { EditorToolbar } from './EditorToolbar'
import type { useEditorDialogs } from './useEditorDialogs'

type Dialogs = ReturnType<typeof useEditorDialogs>

interface Props {
  editor: Editor | null
  dialogs: Dialogs
  uploadingImg: boolean
  imgUploadError: string
  onDismissImgError: () => void
}

/** 编辑器列：工具栏 + 正文区 + 字数栏 + 上传状态条 */
export function EditorBody({ editor, dialogs, uploadingImg, imgUploadError, onDismissImgError }: Props) {
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <EditorToolbar editor={editor} dialogs={dialogs} />
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
          <span>⚠ {imgUploadError}</span>
          <button onClick={onDismissImgError} className="ml-auto text-red-400 hover:text-red-600">✕</button>
        </div>
      )}
      {uploadingImg && (
        <div className="flex items-center gap-2 px-10 py-2 bg-emerald-50 border-t border-emerald-100 text-xs text-emerald-600">
          <Loader2 className="w-3 h-3 animate-spin" />图片上传中，请稍候…
        </div>
      )}
    </div>
  )
}

interface PreviewProps {
  title: string
  /** 预览头部的路由提示：管理员显示 slug，用户显示 /blog/{slug} */
  routeLabel: string
  html: string
}

/** 分屏预览列 */
export function EditorPreview({ title, routeLabel, html }: PreviewProps) {
  return (
    <div className="w-[45%] border-l border-gray-100 bg-white flex flex-col overflow-hidden flex-shrink-0">
      <div className="px-6 py-2.5 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
        <Eye className="w-3.5 h-3.5 text-gray-400" />
        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">实时预览</span>
      </div>
      <div className="flex-1 overflow-y-auto px-8 py-8">
        <h1 className="text-3xl font-black tracking-tighter text-gray-900 mb-2">{title || '（无标题）'}</h1>
        <p className="text-gray-300 text-xs mb-6 font-mono">{routeLabel}</p>
        <div className="preview-content" dangerouslySetInnerHTML={{ __html: html }} />
      </div>
    </div>
  )
}

/** 顶部错误条 */
export function EditorErrorBar({ error, onDismiss }: { error: string; onDismiss?: () => void }) {
  if (!error) return null
  return (
    <div className="flex-shrink-0 bg-red-50 border-b border-red-100 px-6 py-3 text-sm text-red-600 font-medium flex items-center gap-2">
      ⚠ {error}
      {onDismiss && <button onClick={onDismiss} className="ml-auto text-red-400 hover:text-red-600">✕</button>}
    </div>
  )
}
