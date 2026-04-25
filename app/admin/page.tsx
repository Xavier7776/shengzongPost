// app/admin/page.tsx
import Link from 'next/link'
import { Plus, MessageCircle, Images, Layers, ClipboardCheck } from 'lucide-react'
import { requireAdmin } from '@/lib/auth'
import { getAllPostsAdmin, getPendingCommentsCount, getPendingEditRequestsCount } from '@/lib/db'
import AdminPostList from '@/components/admin/AdminPostList'

export default async function AdminPage() {
  await requireAdmin()
  const [posts, pendingComments, pendingEdits] = await Promise.all([
    getAllPostsAdmin(),
    getPendingCommentsCount(),
    getPendingEditRequestsCount(),
  ])

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-8 py-5 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black tracking-tighter text-gray-900">
            ARC<span className="text-blue-600">.</span> 管理后台
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">{posts.length} 篇文章</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Link
            href="/admin/reviews"
            className="relative flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-bold px-5 py-2.5 rounded-xl transition-colors"
          >
            <ClipboardCheck className="w-4 h-4" />
            编辑审核
            {pendingEdits > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] bg-amber-500 text-white text-[10px] font-black rounded-full flex items-center justify-center px-1">
                {pendingEdits}
              </span>
            )}
          </Link>
          <Link
            href="/admin/comments"
            className="relative flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-bold px-5 py-2.5 rounded-xl transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            评论审核
            {pendingComments > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center px-1">
                {pendingComments}
              </span>
            )}
          </Link>
          <Link
            href="/admin/slides"
            className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-bold px-5 py-2.5 rounded-xl transition-colors"
          >
            <Layers className="w-4 h-4" />
            轮播管理
          </Link>
          <Link
            href="/admin/gallery"
            className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-bold px-5 py-2.5 rounded-xl transition-colors"
          >
            Gallery 管理
          </Link>
          <Link
            href="/admin/post-images"
            className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-bold px-5 py-2.5 rounded-xl transition-colors"
          >
            <Images className="w-4 h-4" />
            博文插图
          </Link>
          <Link
            href="/admin/new"
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4" />
            新建文章
          </Link>
        </div>
      </header>

      {/* 文章列表（客户端，含分类筛选） */}
      <AdminPostList posts={posts} />
    </div>
  )
}
