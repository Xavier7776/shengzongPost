'use client'

// app/admin/comments/page.tsx
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Check, X, Loader2, MessageCircle, Trash2, Shield } from 'lucide-react'

interface Comment {
  id: number
  post_slug: string
  user_name: string
  user_role: string        // ✅ 新增：用于显示身份标注
  content: string
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
}

type Tab = 'pending' | 'approved' | 'rejected'

// ✅ 新增：管理员/作者身份徽章（与前台 CommentSection 保持一致）
function RoleBadge({ role }: { role: string }) {
  if (role === 'admin') return (
    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-blue-600 text-white text-[9px] font-black uppercase tracking-widest rounded-md">
      <Shield className="w-2.5 h-2.5" />管理员
    </span>
  )
  if (role === 'author') return (
    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-violet-500 text-white text-[9px] font-black uppercase tracking-widest rounded-md">
      作者
    </span>
  )
  return null
}

export default function AdminCommentsPage() {
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('pending')
  const [acting, setActing] = useState<number | null>(null)
  const [deleting, setDeleting] = useState<number | null>(null)

  useEffect(() => {
    fetch('/api/comments/all')
      .then(r => r.json())
      .then(data => { setComments(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  async function act(id: number, action: 'approve' | 'reject') {
    setActing(id)
    const res = await fetch(`/api/comments/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    })
    if (res.ok) {
      const updated = await res.json()
      setComments(prev => prev.map(c => c.id === id ? { ...c, ...updated } : c))
    }
    setActing(null)
  }

  // ✅ 新增：删除评论
  async function handleDelete(id: number) {
    if (!confirm('确认删除这条评论？此操作不可撤销。')) return
    setDeleting(id)
    const res = await fetch(`/api/comments/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setComments(prev => prev.filter(c => c.id !== id))
    }
    setDeleting(null)
  }

  const filtered = comments.filter(c => c.status === tab)
  const pendingCount = comments.filter(c => c.status === 'pending').length

  const tabs: { key: Tab; label: string }[] = [
    { key: 'pending',  label: '待审核' },
    { key: 'approved', label: '已通过' },
    { key: 'rejected', label: '已拒绝' },
  ]

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      <header className="bg-white border-b border-gray-100 px-8 py-5 flex items-center gap-4">
        <Link href="/admin" className="text-gray-400 hover:text-gray-700 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-black tracking-tighter text-gray-900">
            ARC<span className="text-blue-600">.</span> 评论审核
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">{comments.length} 条评论</p>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-8 py-10">
        {/* Tabs */}
        <div className="flex gap-2 mb-8">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors relative ${
                tab === t.key
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-500 border border-gray-200 hover:border-gray-300'
              }`}
            >
              {t.label}
              {t.key === 'pending' && pendingCount > 0 && (
                <span className={`ml-2 text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                  tab === 'pending' ? 'bg-white/20 text-white' : 'bg-red-100 text-red-500'
                }`}>
                  {pendingCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* List */}
        {loading ? (
          <div className="flex items-center gap-2 text-gray-300 py-16 justify-center">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">加载中…</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-300">
            <MessageCircle className="w-10 h-10 mx-auto mb-3" />
            <p className="font-bold text-sm">暂无{tabs.find(t => t.key === tab)?.label}评论</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(c => (
              <div key={c.id} className="bg-white border border-gray-100 rounded-2xl px-6 py-5 hover:border-gray-200 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      {/* ✅ 用户名 + 身份徽章 */}
                      <span className="text-sm font-black text-gray-900">{c.user_name}</span>
                      <RoleBadge role={c.user_role} />
                      <Link
                        href={`/blog/${c.post_slug}`}
                        target="_blank"
                        className="text-[10px] font-black uppercase tracking-widest text-blue-500 bg-blue-50 px-2 py-0.5 rounded-md hover:bg-blue-100 transition-colors"
                      >
                        {c.post_slug}
                      </Link>
                      <time className="text-xs text-gray-400 font-mono">{c.created_at.slice(0, 16).replace('T', ' ')}</time>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{c.content}</p>
                  </div>

                  {/* 操作按钮 */}
                  <div className="flex gap-2 flex-shrink-0 mt-0.5">
                    {/* 待审核：显示通过/拒绝 */}
                    {tab === 'pending' && (
                      <>
                        <button
                          onClick={() => act(c.id, 'approve')}
                          disabled={acting === c.id}
                          className="flex items-center gap-1 bg-green-500 hover:bg-green-600 text-white text-xs font-bold px-3 py-2 rounded-xl transition-colors disabled:opacity-50"
                        >
                          {acting === c.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                          通过
                        </button>
                        <button
                          onClick={() => act(c.id, 'reject')}
                          disabled={acting === c.id}
                          className="flex items-center gap-1 bg-gray-100 hover:bg-red-100 text-gray-500 hover:text-red-500 text-xs font-bold px-3 py-2 rounded-xl transition-colors disabled:opacity-50"
                        >
                          <X className="w-3 h-3" />
                          拒绝
                        </button>
                      </>
                    )}
                    {/* ✅ 所有 tab 均显示删除按钮 */}
                    <button
                      onClick={() => handleDelete(c.id)}
                      disabled={deleting === c.id}
                      className="flex items-center gap-1 bg-gray-100 hover:bg-red-100 text-gray-400 hover:text-red-500 text-xs font-bold px-3 py-2 rounded-xl transition-colors disabled:opacity-50"
                      title="删除评论"
                    >
                      {deleting === c.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
