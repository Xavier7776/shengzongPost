'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import UserPostEditor from '@/components/dashboard/UserPostEditor'

const AI_ENABLED_ROLES = ['admin', 'wife', 'payMember']

interface InitialData {
  slug: string; title: string; excerpt: string
  content: string; tags: string[]; cover_image: string | null
}

function NewPageInner() {
  const { data: session, status } = useSession()
  const router       = useRouter()
  const searchParams = useSearchParams()
  const fromId       = searchParams.get('from')

  const [initialData, setInitialData] = useState<InitialData | undefined>(undefined)
  const [loadingFrom, setLoadingFrom] = useState(!!fromId)

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login?callbackUrl=/dashboard/new')
  }, [status, router])

  useEffect(() => {
    if (!fromId || status !== 'authenticated') return
    fetch(`/api/edit-requests/my/${fromId}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d) {
          const desiredSlug = d.post_slug?.startsWith('__new__:')
            ? d.post_slug.slice('__new__:'.length)
            : ''
          setInitialData({
            slug: desiredSlug, title: d.title, excerpt: d.excerpt,
            content: d.content, tags: d.tags, cover_image: d.cover_image,
          })
        }
      })
      .finally(() => setLoadingFrom(false))
  }, [fromId, status])

  if (status === 'loading' || loadingFrom) return (
    <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center">
      <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
    </div>
  )

  const role     = (session?.user as { role?: string })?.role ?? ''
  const enableAi = AI_ENABLED_ROLES.includes(role)

  return <UserPostEditor mode="new" enableAi={enableAi} fromId={fromId ? Number(fromId) : null} initialData={initialData} />
}

export default function DashboardNewPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
      </div>
    }>
      <NewPageInner />
    </Suspense>
  )
}
