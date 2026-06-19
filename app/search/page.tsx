// app/search/page.tsx
import { Suspense } from 'react'
import SearchClient from './SearchClient'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '搜索 — MindStack.',
  description: '在博客、Skills、画廊中搜索内容',
}

export default function SearchPage({
  searchParams,
}: {
  searchParams: { q?: string }
}) {
  const q = searchParams.q ?? ''
  return (
    <Suspense fallback={null}>
      <SearchClient initialQuery={q} />
    </Suspense>
  )
}
