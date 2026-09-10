'use client'

import { Loader2, Paperclip, Upload, X } from 'lucide-react'
import type { Attachment } from '@/features/editor/types'

interface Props {
  attachments: Attachment[]
  open: boolean
  onOpenChange: (v: boolean) => void
  filename: string
  onFilenameChange: (v: string) => void
  url: string
  onUrlChange: (v: string) => void
  error: string
  onAdd: () => void
  onRemove: (index: number) => void
  mdUploading: boolean
  onUploadMd: (e: React.ChangeEvent<HTMLInputElement>) => void
}

/** 管理员编辑器的附件区：外链添加 + md 文件上传 + 已附文件列表 */
export function AttachmentsPanel({
  attachments, open, onOpenChange,
  filename, onFilenameChange, url, onUrlChange,
  error, onAdd, onRemove,
  mdUploading, onUploadMd,
}: Props) {
  return (
    <div className="md:col-span-3">
      <div className="flex items-center gap-2 mb-1.5">
        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">
          附件{attachments.length > 0 && `（${attachments.length}）`}
        </label>
        {/* 上传 md 文件按钮 */}
        <label className="flex items-center gap-1 text-[10px] font-bold text-blue-600 hover:text-blue-700 cursor-pointer">
          {mdUploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
          {mdUploading ? '上传中…' : '上传 md'}
          <input type="file" accept=".md,text/markdown,text/plain" className="hidden" onChange={onUploadMd} disabled={mdUploading} />
        </label>
        {/* 添加外链按钮 */}
        <button type="button" onClick={() => onOpenChange(!open)}
          className="flex items-center gap-1 text-[10px] font-bold text-orange-600 hover:text-orange-700">
          <Paperclip className="w-3 h-3" />
          {open ? '收起外链' : '添加外链'}
        </button>
      </div>

      {open && (
        <div className="mb-2 p-3 rounded-xl bg-orange-50 border border-orange-200 space-y-2">
          <p className="text-[10px] font-black uppercase tracking-widest text-orange-400">添加外部链接</p>
          <div className="flex flex-col gap-2">
            <input value={filename} onChange={e => onFilenameChange(e.target.value)} placeholder="文件名，如：论文终稿.pdf"
              className="w-full text-xs text-gray-800 bg-white border border-orange-200 rounded-lg px-3 py-2 focus:outline-none focus:border-orange-400 transition" />
            <input value={url} onChange={e => onUrlChange(e.target.value)} placeholder="链接，如：https://example.com/file.pdf"
              className="w-full text-xs text-gray-800 bg-white border border-orange-200 rounded-lg px-3 py-2 focus:outline-none focus:border-orange-400 transition" />
          </div>
          {error && <p className="text-[10px] text-red-500">{error}</p>}
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => { onOpenChange(false); onFilenameChange(''); onUrlChange('') }}
              className="text-xs text-gray-400 hover:text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors">取消</button>
            <button type="button" onClick={onAdd}
              className="text-xs font-black text-white bg-orange-500 hover:bg-orange-600 px-3 py-1.5 rounded-lg transition-colors">添加</button>
          </div>
        </div>
      )}

      {attachments.length > 0 && (
        <div className="flex flex-col gap-1.5">
          {attachments.map((att, i) => (
            <div key={i} className="flex items-center gap-2 px-3 py-2 bg-orange-50 border border-orange-200 rounded-xl text-xs text-orange-700">
              <Paperclip className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate max-w-[160px] font-medium" title={att.filename}>{att.filename}</span>
              {att.size > 0 && (
                <span className="text-[10px] text-orange-400 flex-shrink-0">{(att.size / 1024).toFixed(1)}KB</span>
              )}
              <a href={att.url} target="_blank" rel="noopener noreferrer"
                className="flex-1 min-w-0 text-blue-500 hover:underline truncate text-[10px]" title={att.url}>
                {att.url}
              </a>
              <button type="button" onClick={() => onRemove(i)} className="text-orange-400 hover:text-red-500 flex-shrink-0" title="删除附件">
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
