// app/api/admin/users/route.ts
import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/auth'
import { getAllUsers } from '@/lib/db'

export async function GET() {
  const session = await requireAdminApi()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const users = await getAllUsers()
    return NextResponse.json(users)
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}
