'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import Link from 'next/link'
import UserPostEditor from '@/components/dashboard/UserPostEditor'

const AI_ENABLED_ROLES = ['admin', 'wife', 'payMember']

interface PostData {
  slug: string; title: string; excerpt: string
  content: string; tags: string[]; cover_image: string | null
}

function EditPageInner() {
  const { slug }                  = useParams<{ slug: string }>()
  const { data: session, status } = useSession()
  const router                    = useRouter()
  const searchParams              = useSearchParams()
  const fromId                    = searchParams.get('from')

  const [post, setPost]         = useState<PostData | null>(null)
  const [loading, setLoading]   = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login?callbackUrl=/dashboard')
  }, [status, router])

  useEffect(() => {
    if (status !== 'authenticated') return
    const url = fromId ? `/api/edit-requests/my/${fromId}` : `/api/posts/${slug}`
    fetch(url)
      .then(async r => { if (!r.ok) { setNotFound(true); setLoading(false); return } return r.json() })
      .then(d => {
        if (!d) return
        setPost({ slug, title: d.title, excerpt: d.excerpt ?? '', content: d.content, tags: d.tags ?? [], cover_image: d.cover_image ?? null })
        setLoading(false)
      })
      .catch(() => { setNotFound(true); setLoading(false) })
  }, [slug, status, fromId])

  if (status === 'loading' || loading) return (
    <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center">
      <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
    </div>
  )

  if (notFound) return (
    <div className="min-h-screen bg-[#FAFAF8] flex flex-col items-center justify-center gap-4">
      <p className="text-gray-400 font-bold">文章不存在</p>
      <Link href="/dashboard" className="text-blue-600 text-sm font-bold hover:underline">返回编辑中心</Link>
    </div>
  )

  const role     = (session?.user as { role?: string })?.role ?? ''
  const enableAi = AI_ENABLED_ROLES.includes(role)

  return <UserPostEditor mode="edit" enableAi={enableAi} fromId={fromId ? Number(fromId) : null} initialData={post!} />
}

export default function UserEditPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
      </div>
    }>
      <EditPageInner />
    </Suspense>
  )
}
