'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useSession } from 'next-auth/react'

const Spreadsheet = dynamic(() => import('./ResearchSpreadsheet'), {
  ssr: false,
  loading: () => <p role="status" className="p-6 text-sm text-gray-500">正在加载表格编辑器…</p>,
})

export default function ResearchSheets() {
  const { data: session, status } = useSession()
  if (status === 'loading') return <p role="status" className="p-6">正在确认登录状态…</p>
  const userId = (session?.user as { id?: string } | undefined)?.id
  if (!userId) return <div className="p-6"><h1 className="text-xl font-bold mb-3">研究表格</h1><p className="text-gray-500 mb-4">登录后即可编辑表格，并将内容保存到你的账号。</p><Link href="/login?callbackUrl=%2Fskills%2Fresearch%3Fview%3Dsheets" className="text-blue-600 underline">登录后使用</Link></div>
  return <Spreadsheet key={String(userId)} />
}
