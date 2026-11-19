import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
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
    <main lang="zh-CN" className="relative min-h-dvh bg-[#FAFAF8] text-[#252a34]">
      <nav aria-label="后台导航" className="border-b border-[#e5e9f0] bg-white">
        <div className="mx-auto flex min-h-16 max-w-6xl flex-wrap items-center justify-between gap-x-4 px-5 sm:min-h-[72px] sm:px-6">
          <div className="flex items-center gap-2.5">
            <Image src="/logo.png" alt="" width={32} height={32} className="size-8 rounded-full" />
            <span lang="en" className="text-[22px] font-black tracking-tight text-gray-900">
              Mind<span className="text-blue-600">Stack</span>
            </span>
          </div>
          <Link href="/admin" className="inline-flex min-h-12 items-center gap-2 rounded-md text-sm font-medium text-slate-600 transition-colors hover:text-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-600">
            <ArrowLeft className="size-4 shrink-0" aria-hidden="true" /> 管理后台
          </Link>
        </div>
      </nav>
      <div className="mx-auto max-w-6xl px-5 pb-16 pt-9 sm:px-6 sm:pb-24 sm:pt-14">
        <StudyJournal initialRecords={records} today={chinaDate()} />
      </div>
    </main>
  )
}
