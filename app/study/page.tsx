import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getAdminAccountId } from '@/lib/auth'
import { listStudyRecords } from '@/lib/db/study-records'
import { loadStudyPlan } from '@/lib/db/study-plans'
import { chinaDate } from '@/lib/learn/document'
import { logFailure } from '@/lib/security/log'
import { defaultPlan, isPlanDate } from '@/features/study-plan/model'
import StudyWorkspace from '@/features/study-plan/StudyWorkspace'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: '学习 · MindStack', robots: { index: false, follow: false } }

export default async function StudyPage() {
  const userId = await getAdminAccountId()
  if (!userId) redirect('/admin/login')

  const [plan, records] = await Promise.allSettled([loadStudyPlan(userId), listStudyRecords(userId)])
  if (plan.status === 'rejected') logFailure('study/plan', plan.reason)
  if (records.status === 'rejected') logFailure('study/records', records.reason)

  const today = chinaDate()
  const history = records.status === 'fulfilled' ? records.value : undefined
  const earliest = history?.filter(entry => entry.date <= today && isPlanDate(entry.date)).at(-1)?.date
  const fallback = { snapshot: defaultPlan(earliest ?? today), revision: 0 }

  return <div className="relative mx-auto min-h-dvh max-w-6xl px-5 pb-16 pt-24 text-[#252a34] sm:px-6 sm:pb-24 sm:pt-28">
    <StudyWorkspace initialPlan={plan.status === 'fulfilled' ? plan.value ?? fallback : fallback} initialRecords={history}
      loadFailed={plan.status === 'rejected'} today={today} aiAvailable={Boolean(process.env.OPENCODE_GO_API_KEY?.trim())} />
  </div>
}
