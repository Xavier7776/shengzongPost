// app/api/comments/all/route.ts
// 管理员拉取所有评论（含 pending/approved/rejected）
import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/auth'
import { getAllCommentsAdmin } from '@/lib/db'

export async function GET() {
  const session = await requireAdminApi()
  if (!session) return NextResponse.json({ error: '无权限' }, { status: 401 })

  try {
    const comments = await getAllCommentsAdmin()
    return NextResponse.json(comments)
  } catch (err) {
    console.error('[comments/all]', err)
    return NextResponse.json({ error: '读取失败' }, { status: 500 })
  }
}
