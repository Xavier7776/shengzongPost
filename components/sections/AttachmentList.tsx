'use client'

// components/sections/AttachmentList.tsx
import { FileText, ExternalLink } from 'lucide-react'

interface Attachment {
  url:          string
  filename:     string
  size:         number
  external_url?: string
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

interface Props { attachments: Attachment[] }

export default function AttachmentList({ attachments }: Props) {
  if (!attachments || attachments.length === 0) return null

  return (
    <section className="mt-16 pt-10 border-t border-gray-100">
      <div className="flex items-center gap-2 mb-5">
        <FileText className="w-4 h-4 text-gray-400" />
        <h3 className="text-xs font-black uppercase tracking-widest text-gray-400">
          附件 · {attachments.length} 份
        </h3>
      </div>

      <div className="space-y-3">
        {attachments.map((att, i) => (
          <div
            key={i}
            className="group flex items-center gap-4 p-4 rounded-2xl border border-gray-100 bg-gray-50 hover:border-blue-200 hover:bg-blue-50 transition-all"
          >
            <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
              <FileText className="w-5 h-5 text-red-500" />
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-800 truncate">{att.filename}</p>
              <p className="text-xs text-gray-400 mt-0.5">PDF · {formatBytes(att.size)}</p>
            </div>

            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              {att.external_url && (
                <a
                  href={att.external_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  下载
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}