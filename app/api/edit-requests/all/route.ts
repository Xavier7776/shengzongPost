import { logFailure } from '@/lib/security/log'
// app/api/edit-requests/all/route.ts
// GET /api/edit-requests/all  → 管理员获取所有编辑请求

import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/auth'
import { getAllEditRequests } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await requireAdminApi()
  if (!session) return NextResponse.json({ error: '无权限' }, { status: 401 })

  try {
    const requests = await getAllEditRequests()
    return NextResponse.json(requests)
  } catch (err) {
    logFailure('app/api/edit-requests/all', err)
    return NextResponse.json({ error: '查询失败' }, { status: 500 })
  }
}
