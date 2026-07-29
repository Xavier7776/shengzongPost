// app/api/research/ws-url/route.ts
// GET /api/research/ws-url - 鉴权后返回 MindStack 研究服务 WebSocket 地址
// 使用服务端私有环境变量 MINDSTACK_RESEARCH_URL，避免地址打包进客户端 bundle
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'

export const dynamic = 'force-dynamic'

export async function GET() {
  // 鉴权：未登录不暴露后端地址
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: '未登录' }, { status: 401 })
  }

  // 优先读取 MindStack 私有变量，回退兼容旧的 GPT_RESEARCHER_URL 命名
  const wsUrl = process.env.MINDSTACK_RESEARCH_URL
    || process.env.GPT_RESEARCHER_URL
    || process.env.NEXT_PUBLIC_GPT_RESEARCHER_URL
    || 'ws://localhost:8000'

  return NextResponse.json(
    { url: wsUrl },
    { headers: { 'Cache-Control': 'no-store' } }
  )
}
