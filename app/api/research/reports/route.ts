// app/api/research/reports/route.ts
// 深度研究历史研报：GET 列表 / POST 保存
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
export const dynamic = 'force-dynamic'
import { authOptions } from '@/lib/authOptions'
import { getResearchReports, createResearchReport } from '@/lib/db'

// GET /api/research/reports → 当前用户的历史研报列表
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: '未登录' }, { status: 401 })
    const userId = Number((session.user as { id?: string }).id)
    if (!userId) return NextResponse.json({ error: '用户信息异常' }, { status: 400 })

    const reports = await getResearchReports(userId)
    return NextResponse.json({ reports }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (err) {
    console.error('[research/reports GET]', err)
    return NextResponse.json({ error: '查询失败' }, { status: 500 })
  }
}

// POST /api/research/reports → 保存一条研报
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: '未登录' }, { status: 401 })
    const userId = Number((session.user as { id?: string }).id)
    if (!userId) return NextResponse.json({ error: '用户信息异常' }, { status: 400 })

    const body = await req.json()
    const topic = String(body.topic ?? '').slice(0, 500)
    const model = String(body.model ?? '').slice(0, 100)
    const language = String(body.language ?? '中文').slice(0, 50)
    const status = String(body.status ?? 'finished').slice(0, 50)
    const reportContent = String(body.report_content ?? '')
    const elapsedSeconds = Number(body.elapsed_seconds ?? 0) || 0

    if (!topic) return NextResponse.json({ error: '缺少研究主题' }, { status: 400 })

    const report = await createResearchReport({
      user_id: userId,
      topic,
      model,
      language,
      status,
      report_content: reportContent,
      elapsed_seconds: elapsedSeconds,
    })

    return NextResponse.json({ success: true, report }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (err) {
    console.error('[research/reports POST]', err)
    return NextResponse.json({ error: '保存失败' }, { status: 500 })
  }
}
