'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('页面运行时错误：', error)
  }, [error])

  const isDev = process.env.NODE_ENV === 'development'

  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-6">
      <div className="relative">
        <p
          className="text-[140px] md:text-[180px] font-black leading-none select-none"
          style={{
            background: 'linear-gradient(135deg, #dbeafe 0%, #e0e7ff 50%, #ede9fe 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            animation: 'breathe 4s ease-in-out infinite',
          }}
        >
          500
        </p>
      </div>

      <h1 className="text-2xl md:text-3xl font-black text-gray-900 mt-2 mb-3 tracking-tight">
        页面加载出错
      </h1>
      <p className="text-gray-500 mb-10 max-w-md leading-relaxed">
        抱歉，页面在加载过程中遇到了问题。请尝试重新加载，或返回首页继续浏览。
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
          href="/"
          className="bg-white text-gray-700 px-8 py-3 rounded-2xl font-bold border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all"
        >
          返回首页
        </Link>
      </div>

      <style>{`
        @keyframes breathe {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.03); }
        }
      `}</style>
    </div>
  )
}
