import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getAdminAccountId } from '@/lib/auth'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { robots: { index: false, follow: false } }

export default async function AdminStudyRecordsPage() {
  if (!await getAdminAccountId()) redirect('/admin/login')
  redirect('/?view=study')
}
