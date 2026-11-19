import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft, LockKeyhole } from 'lucide-react'
import { getAdminAccountId } from '@/lib/auth'
import { listStudyRecords } from '@/lib/db/study-records'
import { chinaDate } from '@/lib/learn/document'
import { logFailure } from '@/lib/security/log'
import StudyJournal from '@/features/study-records/StudyJournal'
import type { SavedEntry } from '@/features/study-records/model'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = {
  title: '学习记录 · 管理后台',
  robots: { index: false, follow: false },
}

export default async function AdminStudyRecordsPage() {
  const userId = await getAdminAccountId()
  if (!userId) redirect('/admin/login')

  let records: SavedEntry[] | null = null
  try {
    records = await listStudyRecords(userId)
  } catch (error) {
    logFailure('admin/study-records/page', error)
  }

  return (
    <main lang="zh-CN" className="min-h-screen bg-white px-5 py-8 text-gray-900 sm:px-8 sm:py-12">
      <div className="mx-auto max-w-5xl">
        <nav aria-label="后台导航" className="mb-8">
          <Link href="/admin" className="inline-flex min-h-12 items-center gap-2 rounded text-sm font-medium text-gray-600 hover:text-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-600">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" /> 管理后台
          </Link>
        </nav>
        <header>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">学习记录</h1>
          <p className="mt-4 flex items-center gap-2 text-sm leading-6 text-gray-600">
            <LockKeyhole className="h-4 w-4 shrink-0" aria-hidden="true" /> 仅当前管理员账号可见
          </p>
        </header>
        <StudyJournal initialRecords={records} today={chinaDate()} />
      </div>
    </main>
  )
}
