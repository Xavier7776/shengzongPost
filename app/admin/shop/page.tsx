// app/admin/shop/page.tsx
// 商城管理页：管理鼠标效果 + 头像框
import Link from 'next/link'
import { ArrowLeft, MousePointer2, Square } from 'lucide-react'
import { requireAdmin } from '@/lib/auth'
import ShopAdminTabs from '@/components/admin/shop/ShopAdminTabs'

export default async function AdminShopPage() {
  await requireAdmin()

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-8 py-5">
        <div className="flex items-center gap-4">
          <Link href="/admin" className="text-gray-400 hover:text-gray-700 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-black tracking-tighter text-gray-900">
              ARC<span className="text-blue-600">.</span> 商城管理
            </h1>
            <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-3">
              <span className="flex items-center gap-1">
                <MousePointer2 className="w-3 h-3" />鼠标效果
              </span>
              <span className="flex items-center gap-1">
                <Square className="w-3 h-3" />头像框
              </span>
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-8 py-8">
        <ShopAdminTabs />
      </main>
    </div>
  )
}
