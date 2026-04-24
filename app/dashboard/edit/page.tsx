'use client'

// app/dashboard/edit/page.tsx — 选择要编辑的文章
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, PenLine, Loader2, Search, CheckCircle } from 'lucide-react'

interface PostMeta {
  id: number
  slug: string
  title: string
  excerpt: string
  tags: string[]
  created_at: string
  author_id: number | null
}

interface EditRequest {
  id: number
  post_slug: string
  post_title: string
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
}

export default function PickPostPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [posts, setPosts]           = useState<PostMeta[]>([])
  const [myRequests, setMyRequests] = useState<EditRequest[]>([])
  const [loading, setLoading]       = useState(true)
  const [query, setQuery]           = useState('')

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login?callbackUrl=/dashboard/edit')
  }, [status, router])

  useEffect(() => {
    if (status !== 'authenticated') return
    Promise.all([
      fetch('/api/posts/public').then(r => r.ok ? r.json() : []).catch(() => []),
      fetch('/api/edit-requests').then(r => r.ok ? r.json() : []).catch(() => []),
    ]).then(([p, r]) => {
      setPosts(Array.isArray(p) ? p : [])
      setMyRequests(Array.isArray(r) ? r : [])
      setLoading(false)
    })
  }, [status])

  const myId = Number((session?.user as { id?: string })?.id ?? 0)

  // 只显示自己发布的文章
  const myPosts = posts.filter(p => p.author_id === myId)

  // 已通过审核的文章 slug 集合（用于标注）
  const approvedSlugs = new Set(
    myRequests.filter(r => r.status === 'approved').map(r => r.post_slug)
  )

  const filtered = myPosts.filter(p =>
    p.title.toLowerCase().includes(query.toLowerCase()) ||
    p.slug.toLowerCase().includes(query.toLowerCase())
  )

  if (status === 'loading' || loading) return (
    <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center">
      <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-[#FAFAF8] pt-24 pb-20 px-4">
      <div className="max-w-2xl mx-auto">

        <Link href="/dashboard" className="inline-flex items-center gap-2 text-xs font-black tracking-widest text-gray-400 hover:text-gray-900 transition-colors mb-8">
          <ArrowLeft className="w-3.5 h-3.5" />返回编辑中心
        </Link>

        <h1 className="text-2xl font-black tracking-tighter text-gray-900 mb-2">选择文章</h1>
        <p className="text-sm text-gray-400 mb-8">只显示你发布的文章，选择后提交编辑请求，管理员审核通过后生效</p>

        {/* 搜索 */}
        <div className="relative mb-6">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="搜索文章标题或 slug…"
            className="w-full bg-white border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm text-gray-700 focus:outline-none focus:border-blue-400 transition-colors"
          />
        </div>

        {myPosts.length === 0 ? (
          <div className="text-center py-16 text-gray-300">
            <PenLine className="w-10 h-10 mx-auto mb-3" />
            <p className="text-sm font-bold">你还没有发布过文章</p>
            <p className="text-xs mt-2">可以先在「新建文章」提交，审核通过后即可在此编辑</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-300">
            <PenLine className="w-10 h-10 mx-auto mb-3" />
            <p className="text-sm font-bold">没有匹配的文章</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(post => (
              <Link
                key={post.slug}
                href={`/dashboard/edit/${post.slug}`}
                className="flex items-center gap-4 bg-white border border-gray-100 rounded-2xl px-5 py-4 hover:border-blue-200 hover:shadow-md transition-all duration-200 group"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <p className="font-bold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                      {post.title}
                    </p>
                    {approvedSlugs.has(post.slug) && (
                      <span className="flex-shrink-0 inline-flex items-center gap-1 text-[10px] font-black text-green-600 bg-green-50 border border-green-200 px-1.5 py-0.5 rounded-md">
                        <CheckCircle className="w-2.5 h-2.5" />已通过
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 font-mono mt-0.5 truncate">/{post.slug}</p>
                  {post.tags.length > 0 && (
                    <div className="flex gap-1.5 mt-2 flex-wrap">
                      {post.tags.slice(0, 4).map(t => (
                        <span key={t} className="text-[10px] uppercase tracking-widest font-bold bg-gray-50 text-gray-400 px-2 py-0.5 rounded-md border border-gray-100">
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex-shrink-0 flex items-center gap-2 text-gray-300 group-hover:text-blue-500 transition-colors">
                  <PenLine className="w-4 h-4" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
