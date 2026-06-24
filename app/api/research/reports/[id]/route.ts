// app/api/research/reports/[id]/route.ts
// 单条研报：GET 详情 / DELETE 删除
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
export const dynamic = 'force-dynamic'
import { authOptions } from '@/lib/authOptions'
import { getResearchReportById, deleteResearchReport } from '@/lib/db'

// GET /api/research/reports/:id → 单条研报详情（含正文）
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: '未登录' }, { status: 401 })
    const userId = Number((session.user as { id?: string }).id)
    if (!userId) return NextResponse.json({ error: '用户信息异常' }, { status: 400 })

    const { id } = await params
    const reportId = Number(id)
    if (!reportId) return NextResponse.json({ error: '无效的研报 ID' }, { status: 400 })

    const report = await getResearchReportById(userId, reportId)
    if (!report) return NextResponse.json({ error: '研报不存在' }, { status: 404 })

    return NextResponse.json({ report }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (err) {
    console.error('[research/reports/:id GET]', err)
    return NextResponse.json({ error: '查询失败' }, { status: 500 })
  }
}

// DELETE /api/research/reports/:id → 删除一条研报
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: '未登录' }, { status: 401 })
    const userId = Number((session.user as { id?: string }).id)
    if (!userId) return NextResponse.json({ error: '用户信息异常' }, { status: 400 })

    const { id } = await params
    const reportId = Number(id)
    if (!reportId) return NextResponse.json({ error: '无效的研报 ID' }, { status: 400 })

    await deleteResearchReport(userId, reportId)
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[research/reports/:id DELETE]', err)
    return NextResponse.json({ error: '删除失败' }, { status: 500 })
  }
}
