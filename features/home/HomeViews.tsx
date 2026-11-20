'use client'

import { Suspense, useEffect, type ReactNode } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'

function RedirectStudyLink() {
  const params = useSearchParams()
  const router = useRouter()
  const isLegacyStudy = params.get('view') === 'study'
  useEffect(() => {
    if (isLegacyStudy) router.replace('/study')
  }, [isLegacyStudy, router])
  return null
}

export default function HomeViews({ children }: { children: ReactNode }) {
  const { data: session } = useSession()
  const user = session?.user as { role?: string } | undefined
  return <>
    {user?.role === 'admin' && <Suspense><RedirectStudyLink /></Suspense>}
    {children}
  </>
}
