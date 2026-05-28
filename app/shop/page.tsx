import FrameShop from '@/components/shop/FrameShop'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata = { title: '积分商城' }

export default function ShopPage() {
  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-12 px-4 md:px-8">
      <div className="max-w-2xl mx-auto">
        <Link
          href="/profile"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors mb-6"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          返回个人中心
        </Link>
        <h1 className="text-2xl font-black text-slate-900 mb-6">积分商城</h1>
        <FrameShop />
      </div>
    </div>
  )
}
