// components/sections/AttachmentList.tsx
import { Paperclip } from 'lucide-react'

interface Attachment {
  url: string
  filename: string
  size: number
}

interface Props { attachments: Attachment[] }

export default function AttachmentList({ attachments }: Props) {
  if (!attachments || attachments.length === 0) return null

  return (
    <div className="mt-12 border-t border-gray-100 pt-8">
      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">
        附件 · {attachments.length} 份
      </p>
      <div className="flex flex-col gap-2">
        {attachments.map((att, i) => (
          <a
            key={i}
            href={att.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-4 py-3 bg-orange-50 hover:bg-orange-100 border border-orange-200 rounded-xl transition-colors group"
          >
            <Paperclip className="w-4 h-4 text-orange-400 flex-shrink-0" />
            <span className="flex-1 text-sm font-medium text-orange-700 truncate group-hover:underline">
              {att.filename}
            </span>
            <span className="text-[10px] text-orange-400 flex-shrink-0">蓝奏云 ↗</span>
          </a>
        ))}
      </div>
    </div>
  )
}
