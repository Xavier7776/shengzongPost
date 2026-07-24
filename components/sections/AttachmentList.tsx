// components/sections/AttachmentList.tsx
import { Download, ExternalLink } from 'lucide-react'

interface Attachment {
  url: string
  filename: string
  size: number
}

interface Props { attachments: Attachment[] }

function formatSize(bytes: number): string {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function AttachmentList({ attachments }: Props) {
  if (!attachments || attachments.length === 0) return null

  return (
    <div className="mt-12 border-t border-gray-100 pt-8">
      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">
        附件 · {attachments.length} 份
      </p>
      <div className="flex flex-col gap-2">
        {attachments.map((att, i) => {
          // size > 0 表示上传的文件（显示下载图标 + 文件大小），否则为外链
          const isUploaded = att.size > 0
          // 确保 filename 带后缀（兜底：旧 URL 若无后缀，下载时仍能正确命名）
          const downloadName = isUploaded && !/\.[a-z0-9]+$/i.test(att.filename)
            ? `${att.filename}.md`
            : att.filename
          return (
            <a
              key={i}
              href={att.url}
              target="_blank"
              rel="noopener noreferrer"
              download={isUploaded ? downloadName : undefined}
              className="flex items-center gap-3 px-4 py-3 bg-orange-50 hover:bg-orange-100 border border-orange-200 rounded-xl transition-colors group"
            >
              {isUploaded ? (
                <Download className="w-4 h-4 text-orange-400 flex-shrink-0" />
              ) : (
                <ExternalLink className="w-4 h-4 text-orange-400 flex-shrink-0" />
              )}
              <span className="flex-1 text-sm font-medium text-orange-700 truncate group-hover:underline">
                {att.filename}
              </span>
              {isUploaded ? (
                <span className="text-[10px] text-orange-400 flex-shrink-0">{formatSize(att.size)}</span>
              ) : (
                <span className="text-[10px] text-orange-400 flex-shrink-0">外链 ↗</span>
              )}
            </a>
          )
        })}
      </div>
    </div>
  )
}
