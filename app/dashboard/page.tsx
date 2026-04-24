'use client'

// app/dashboard/page.tsx  — 用户编辑中心入口
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, PenLine, Clock, CheckCircle, XCircle, Loader2, FileText, Plus } from 'lucide-react'

interface EditRequest {
  id: number
  post_slug: string
  post_title: string
  status: 'pending' | 'approved' | 'rejected'
  admin_note: string | null
  created_at: string
  reviewed_at: string | null
}

const STATUS_MAP = {
  pending:  { label: '审核中', icon: Clock,         color: 'text-amber-600 bg-amber-50 border-amber-200' },
  approved: { label: '已通过', icon: CheckCircle,   color: 'text-green-600 bg-green-50 border-green-200' },
  rejected: { label: '已拒绝', icon: XCircle,       color: 'text-red-500 bg-red-50 border-red-200' },
}

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [requests, setRequests] = useState<EditRequest[]>([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login?callbackUrl=/dashboard')
  }, [status, router])

  useEffect(() => {
    if (status !== 'authenticated') return
    fetch('/api/edit-requests')
      .then(r => r.json())
      .then(d => { setRequests(Array.isArray(d) ? d : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [status])

  if (status === 'loading' || loading) return (
    <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center">
      <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
    </div>
  )

  const pending  = requests.filter(r => r.status === 'pending').length
  const approved = requests.filter(r => r.status === 'approved').length

  return (
    <div className="min-h-screen bg-[#FAFAF8] pt-24 pb-20 px-4">
      <div className="max-w-2xl mx-auto">

        <Link href="/" className="inline-flex items-center gap-2 text-xs font-black tracking-widest text-gray-400 hover:text-gray-900 transition-colors mb-8">
          <ArrowLeft className="w-3.5 h-3.5" />返回首页
        </Link>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-black tracking-tighter text-gray-900">编辑中心</h1>
            <p className="text-sm text-gray-400 mt-1">提交文章修改，等待管理员审核后生效</p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard/new"
              className="flex items-center gap-2 bg-gray-900 hover:bg-gray-700 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition-colors"
            >
              <Plus className="w-4 h-4" />新建文章
            </Link>
            <Link
              href="/dashboard/edit"
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition-colors"
            >
              <PenLine className="w-4 h-4" />编辑文章
            </Link>
          </div>
        </div>

        {/* 统计 */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          {[
            { label: '全部提交', value: requests.length, color: 'text-gray-900' },
            { label: '审核中',   value: pending,          color: 'text-amber-600' },
            { label: '已通过',   value: approved,         color: 'text-green-600' },
          ].map(s => (
            <div key={s.label} className="bg-white border border-gray-100 rounded-2xl p-4 text-center">
              <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* 提交历史 */}
        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-50">
            <h2 className="text-sm font-black text-gray-700">提交历史</h2>
          </div>

          {requests.length === 0 ? (
            <div className="py-16 text-center text-gray-300">
              <FileText className="w-10 h-10 mx-auto mb-3" />
              <p className="text-sm font-bold">还没有提交过编辑</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {requests.map(r => {
                const s = STATUS_MAP[r.status]
                const Icon = s.icon
                return (
                  <div key={r.id} className="px-6 py-4 flex items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border ${s.color}`}>
                          <Icon className="w-3 h-3" />{s.label}
                        </span>
                        <time className="text-xs text-gray-400 font-mono">{r.created_at.slice(0, 10)}</time>
                      </div>
                      <p className="text-sm font-bold text-gray-900 truncate flex items-center gap-2">
                        {r.post_title}
                        {r.post_slug.startsWith('__new__:') && (
                          <span className="text-[10px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded bg-blue-50 text-blue-500 border border-blue-100 flex-shrink-0">新建</span>
                        )}
                      </p>
                      {r.admin_note && (
                        <p className="text-xs text-gray-400 mt-1 bg-gray-50 rounded-lg px-2.5 py-1.5">
                          管理员备注：{r.admin_note}
                        </p>
                      )}
                    </div>
                    {r.status === 'rejected' && (
                      <Link
                        href={r.post_slug.startsWith('__new__:') ? `/dashboard/new?from=${r.id}` : `/dashboard/edit/${r.post_slug}?from=${r.id}`}
                        className="flex-shrink-0 text-xs font-bold text-blue-600 hover:text-blue-700 border border-blue-200 hover:border-blue-400 px-3 py-1.5 rounded-xl transition-colors"
                      >
                        重新编辑
                      </Link>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
