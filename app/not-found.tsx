import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-6">
      <div className="relative">
        <p
          className="text-[140px] md:text-[180px] font-black leading-none select-none"
          style={{
            background: 'linear-gradient(135deg, #e0e7ff 0%, #dbeafe 50%, #ede9fe 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            animation: 'breathe 4s ease-in-out infinite',
          }}
        >
          404
        </p>
      </div>

      <h1 className="text-2xl md:text-3xl font-black text-gray-900 mt-2 mb-3 tracking-tight">
        页面走丢了
      </h1>
      <p className="text-gray-500 mb-10 max-w-md leading-relaxed">
        你要找的页面可能已被移动、删除，或者从未存在过。
      </p>

      <div className="flex items-center gap-3">
        <Link
          href="/"
          className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-bold hover:bg-blue-700 transition-colors shadow-sm"
        >
          回到首页
        </Link>
        <Link
          href="/blog"
          className="bg-white text-gray-700 px-8 py-3 rounded-2xl font-bold border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all"
        >
          查看博客
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
