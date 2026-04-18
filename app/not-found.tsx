import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-6">
      <p className="text-[120px] font-black text-gray-100 leading-none select-none">404</p>
      <h1 className="text-2xl font-black text-gray-900 mt-4 mb-3">页面不存在</h1>
      <p className="text-gray-500 mb-10">你要找的内容可能已被移动或删除。</p>
      <Link
        href="/"
        className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-bold hover:bg-blue-700 transition-colors"
      >
        回到首页
      </Link>
    </div>
  )
}
