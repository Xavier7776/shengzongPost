'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function WorkDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('项目加载失败：', error)
  }, [error])

  const isDev = process.env.NODE_ENV === 'development'

  return (
    <div className="min-h-[70vh] pt-24 pb-16 flex flex-col items-center justify-center text-center px-6">
      <p
        className="text-[100px] md:text-[140px] font-black leading-none select-none mb-2"
        style={{
          background: 'linear-gradient(135deg, #dbeafe 0%, #e0e7ff 50%, #ede9fe 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}
      >
        出错
      </p>

      <h1 className="text-2xl md:text-3xl font-black text-gray-900 mt-2 mb-3 tracking-tight">
        项目加载失败
      </h1>
      <p className="text-gray-500 mb-10 max-w-md leading-relaxed">
        这个项目暂时无法加载，可能是网络问题或内容已失效。请重试，或返回作品列表查看其他项目。
      </p>

      {isDev && (
        <pre className="mb-8 max-w-2xl w-full text-left bg-gray-50 border border-gray-200 rounded-2xl p-4 text-xs text-red-600 font-mono whitespace-pre-wrap break-all overflow-auto">
          {error.message}
          {error.digest ? `\n\ndigest: ${error.digest}` : ''}
        </pre>
      )}

      <div className="flex items-center gap-3">
        <button
          onClick={reset}
          className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-bold hover:bg-blue-700 transition-colors shadow-sm"
        >
          重试
        </button>
        <Link
          href="/work"
          className="bg-white text-gray-700 px-8 py-3 rounded-2xl font-bold border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all"
        >
          返回作品列表
        </Link>
      </div>
    </div>
  )
}
