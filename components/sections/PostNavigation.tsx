import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PostMeta {
  slug: string
  title: string
  created_at: string
}

interface PostNavigationProps {
  prev: PostMeta | null
  next: PostMeta | null
}

export default function PostNavigation({ prev, next }: PostNavigationProps) {
  if (!prev && !next) return null

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-16 pt-8 border-t border-gray-100">
      {/* 上一篇 */}
      {prev ? (
        <Link
          href={`/blog/${prev.slug}`}
          className="group flex items-start gap-3 p-5 rounded-2xl border border-gray-100 hover:border-gray-200 hover:shadow-md transition-all duration-300"
        >
          <ChevronLeft className="w-5 h-5 text-gray-400 group-hover:text-blue-600 group-hover:-translate-x-1 transition-all mt-0.5 flex-shrink-0" />
          <div className="min-w-0 text-left">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">上一篇</p>
            <p className="text-sm font-bold text-gray-900 group-hover:text-blue-600 transition-colors truncate">
              {prev.title}
            </p>
            <time className="text-xs text-gray-400 font-mono mt-1 block">{prev.created_at.slice(0, 10)}</time>
          </div>
        </Link>
      ) : <div />}

      {/* 下一篇 */}
      {next ? (
        <Link
          href={`/blog/${next.slug}`}
          className="group flex items-start gap-3 p-5 rounded-2xl border border-gray-100 hover:border-gray-200 hover:shadow-md transition-all duration-300 md:flex-row-reverse md:text-right"
        >
          <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all mt-0.5 flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">下一篇</p>
            <p className="text-sm font-bold text-gray-900 group-hover:text-blue-600 transition-colors truncate">
              {next.title}
            </p>
            <time className="text-xs text-gray-400 font-mono mt-1 block">{next.created_at.slice(0, 10)}</time>
          </div>
        </Link>
      ) : <div />}
    </div>
  )
}
