// app/admin/page.tsx
import Link from 'next/link'
import { PenLine, Plus, Trash2, Eye, EyeOff } from 'lucide-react'
import { requireAdmin } from '@/lib/auth'
import { getAllPostsAdmin } from '@/lib/db'
import AdminActions from '@/components/admin/AdminActions'

export default async function AdminPage() {
  await requireAdmin()
  const posts = await getAllPostsAdmin()

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
        <Link
          href="/admin/new"
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-colors"
        >
          <Plus className="w-4 h-4" />
          新建文章
        </Link>
      </header>

      {/* Post list */}
      <main className="max-w-4xl mx-auto px-8 py-10">
        {posts.length === 0 && (
          <div className="text-center py-24 text-gray-300">
            <PenLine className="w-12 h-12 mx-auto mb-4" />
            <p className="font-bold">还没有文章，点击右上角开始写作</p>
          </div>
        )}
        <div className="space-y-3">
          {posts.map(post => (
            <div
              key={post.slug}
              className="bg-white border border-gray-100 rounded-2xl px-6 py-5 flex items-center justify-between gap-4 hover:border-gray-200 transition-colors"
            >
              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <span className={`inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${
                    post.published
                      ? 'bg-green-50 text-green-600'
                      : 'bg-gray-100 text-gray-400'
                  }`}>
                    {post.published ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                    {post.published ? '已发布' : '草稿'}
                  </span>
                  <time className="text-xs text-gray-400 font-mono">{post.created_at.slice(0, 10)}</time>
                </div>
                <h2 className="font-bold text-gray-900 truncate">{post.title}</h2>
                <p className="text-xs text-gray-400 mt-1 truncate font-mono">/{post.slug}</p>
              </div>

              {/* Actions (client component for delete confirm) */}
              <AdminActions slug={post.slug} published={post.published} />
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
