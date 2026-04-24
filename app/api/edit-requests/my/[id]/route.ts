// app/api/edit-requests/my/[id]/route.ts
// 用户读取自己的某条 edit-request（用于拒绝后回填内容）
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { getEditRequestById } from '@/lib/db'

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: '请先登录' }, { status: 401 })

  const userId = Number((session.user as { id?: string }).id)
  const id     = Number(params.id)
  if (!id) return NextResponse.json({ error: '参数错误' }, { status: 400 })

  try {
    const req = await getEditRequestById(id)
    if (!req) return NextResponse.json({ error: '不存在' }, { status: 404 })
    // 只允许读自己的
    if (req.user_id !== userId) return NextResponse.json({ error: '无权限' }, { status: 403 })
    return NextResponse.json(req)
  } catch (err) {
    console.error('[edit-requests/my GET]', err)
    return NextResponse.json({ error: '查询失败' }, { status: 500 })
  }
}
