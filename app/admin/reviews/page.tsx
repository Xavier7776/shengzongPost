'use client'

// app/admin/reviews/page.tsx — 管理员审核用户编辑请求
import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, CheckCircle, XCircle, Clock, ChevronDown,
  ChevronUp, Loader2, User, Eye,
} from 'lucide-react'

interface EditRequest {
  id: number
  post_slug: string
  post_title: string
  user_id: number
  user_name: string
  user_avatar: string | null
  title: string
  excerpt: string
  content: string
  tags: string[]
  cover_image: string | null
  status: 'pending' | 'approved' | 'rejected'
  admin_note: string | null
  created_at: string
  reviewed_at: string | null
}

const STATUS_STYLE = {
  pending:  'bg-amber-50 text-amber-600 border-amber-200',
  approved: 'bg-green-50 text-green-600 border-green-200',
  rejected: 'bg-red-50 text-red-500 border-red-200',
}
const STATUS_LABEL = { pending: '待审核', approved: '已通过', rejected: '已拒绝' }

// ── 单条请求卡片 ──────────────────────────────────────────────────────────────
function RequestCard({
  req,
  onReviewed,
}: {
  req: EditRequest
  onReviewed: (id: number, status: 'approved' | 'rejected', note: string) => void
}) {
  const [expanded, setExpanded] = useState(req.status === 'pending')
  const [note, setNote]         = useState('')
  const [loading, setLoading]   = useState(false)
  const [err, setErr]           = useState('')

  async function review(status: 'approved' | 'rejected') {
    setLoading(true); setErr('')
    try {
      const res = await fetch(`/api/edit-requests/all/${req.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, admin_note: note.trim() || null }),
      })
      const data = await res.json()
      if (!res.ok) { setErr(data.error ?? '操作失败'); return }
      onReviewed(req.id, status, note.trim())
    } catch { setErr('网络错误') }
    finally { setLoading(false) }
  }

  return (
    <div className={`bg-white border rounded-2xl overflow-hidden transition-all duration-200 ${
      req.status === 'pending' ? 'border-amber-200 shadow-sm shadow-amber-100' : 'border-gray-100'
    }`}>
      {/* 卡头 */}
      <div className="flex items-center gap-4 px-5 py-4">
        {/* 用户头像 */}
        <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
          {req.user_avatar
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={req.user_avatar} alt={req.user_name} className="w-full h-full object-cover" />
            : <User className="w-4 h-4 text-blue-500" />
          }
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border ${STATUS_STYLE[req.status]}`}>
              {STATUS_LABEL[req.status]}
            </span>
            <span className="text-xs text-gray-400 font-mono">{req.created_at.slice(0, 10)}</span>
          </div>
          <p className="text-sm font-bold text-gray-900 truncate">{req.post_title}</p>
          <p className="text-xs text-gray-400 truncate">
            by {req.user_name} · {req.post_slug.startsWith('__new__:')
              ? <span className="text-blue-500">新建文章申请</span>
              : req.title !== req.post_title
                ? <span>改为：<span className="text-blue-500">{req.title}</span></span>
                : '标题未变'
            }
          </p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {req.post_slug.startsWith('__new__:') ? (
            <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border bg-blue-50 text-blue-500 border-blue-200">
              新建
            </span>
          ) : (
            <Link
              href={`/blog/${req.post_slug}`}
              target="_blank"
              className="p-2 text-gray-300 hover:text-gray-600 rounded-lg transition-colors"
              title="查看原文"
            >
              <Eye className="w-4 h-4" />
            </Link>
          )}
          <button
            onClick={() => setExpanded(v => !v)}
            className="p-2 text-gray-300 hover:text-gray-600 rounded-lg transition-colors"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* 展开：详细内容对比 */}
      {expanded && (
        <div className="border-t border-gray-50 px-5 py-4 space-y-4">

          {/* 封面图 */}
          {req.cover_image && (
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">封面图</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={req.cover_image} alt="封面" className="h-24 rounded-xl object-cover border border-gray-100" />
            </div>
          )}

          {/* 摘要 */}
          {req.excerpt && (
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">摘要</p>
              <p className="text-sm text-gray-600 bg-gray-50 rounded-xl px-3 py-2">{req.excerpt}</p>
            </div>
          )}

          {/* 标签 */}
          {req.tags.length > 0 && (
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">标签</p>
              <div className="flex flex-wrap gap-1.5">
                {req.tags.map(t => (
                  <span key={t} className="text-[10px] uppercase tracking-widest font-bold bg-blue-50 text-blue-500 px-2 py-0.5 rounded-md">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 正文预览 */}
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">正文预览</p>
            <pre className="text-xs text-gray-600 bg-gray-50 rounded-xl px-4 py-3 overflow-x-auto whitespace-pre-wrap font-mono leading-relaxed max-h-64 overflow-y-auto">
              {req.content}
            </pre>
          </div>

          {/* 已审核结果 */}
          {req.status !== 'pending' ? (
            <div className={`rounded-xl px-4 py-3 border ${STATUS_STYLE[req.status]}`}>
              <p className="text-xs font-bold">{STATUS_LABEL[req.status]} · {req.reviewed_at?.slice(0, 10)}</p>
              {req.admin_note && <p className="text-xs mt-1 opacity-80">备注：{req.admin_note}</p>}
            </div>
          ) : (
            /* 审核操作区 */
            <div className="space-y-3 pt-2 border-t border-gray-50">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-1.5">
                  审核备注（可选，拒绝时建议填写原因）
                </label>
                <input
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder="如：内容有误，请修改 XX 部分…"
                  className="w-full text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-blue-400 transition"
                />
              </div>

              {err && <p className="text-xs text-red-500">{err}</p>}

              <div className="flex gap-2">
                <button
                  onClick={() => review('approved')}
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-bold py-2.5 rounded-xl transition-colors disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  {req.post_slug.startsWith('__new__:') ? '批准并创建草稿' : '批准并更新文章'}
                </button>
                <button
                  onClick={() => review('rejected')}
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 text-sm font-bold py-2.5 rounded-xl transition-colors disabled:opacity-50"
                >
                  <XCircle className="w-4 h-4" />
                  拒绝
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── 主页面 ────────────────────────────────────────────────────────────────────
export default function AdminReviewsPage() {
  const [requests, setRequests] = useState<EditRequest[]>([])
  const [loading, setLoading]   = useState(true)
  const [filter, setFilter]     = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending')

  useEffect(() => {
    fetch('/api/edit-requests/all')
      .then(r => r.json())
      .then(d => { setRequests(Array.isArray(d) ? d : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  function handleReviewed(id: number, status: 'approved' | 'rejected', note: string) {
    setRequests(prev => prev.map(r =>
      r.id === id ? { ...r, status, admin_note: note || null, reviewed_at: new Date().toISOString() } : r
    ))
  }

  const filtered = filter === 'all' ? requests : requests.filter(r => r.status === filter)
  const pendingCount = requests.filter(r => r.status === 'pending').length

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      <header className="bg-white border-b border-gray-100 px-8 py-5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin" className="text-gray-400 hover:text-gray-700 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-black tracking-tighter text-gray-900">
              ARC<span className="text-blue-600">.</span> 编辑审核
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">
              {requests.length} 条请求 · {pendingCount} 条待审核
            </p>
          </div>
        </div>
        {pendingCount > 0 && (
          <span className="text-sm font-black text-amber-600 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl">
            {pendingCount} 条待处理
          </span>
        )}
      </header>

      <main className="max-w-3xl mx-auto px-8 py-8 space-y-4">

        {/* 筛选 tabs */}
        <div className="flex gap-1 bg-white border border-gray-100 rounded-xl p-1 w-fit">
          {([
            { key: 'pending',  label: `待审核 ${pendingCount}` },
            { key: 'approved', label: '已通过' },
            { key: 'rejected', label: '已拒绝' },
            { key: 'all',      label: '全部' },
          ] as const).map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-4 py-1.5 rounded-lg text-xs font-black transition-colors ${
                filter === f.key
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-400 hover:text-gray-700'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-24">
            <Loader2 className="w-6 h-6 text-gray-300 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24 text-gray-300">
            <Clock className="w-10 h-10 mx-auto mb-3" />
            <p className="font-bold text-sm">暂无{filter === 'pending' ? '待审核' : ''}请求</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(req => (
              <RequestCard key={req.id} req={req} onReviewed={handleReviewed} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
