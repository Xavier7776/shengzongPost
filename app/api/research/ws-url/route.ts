// app/api/research/ws-url/route.ts
// GET /api/research/ws-url - 鉴权后返回 gpt-researcher WebSocket 地址
// 使用服务端私有环境变量 GPT_RESEARCHER_URL，避免地址打包进客户端 bundle
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

  // 优先读取服务端私有环境变量（不打包进客户端），回退兼容旧的 NEXT_PUBLIC_ 变量
  const wsUrl = process.env.GPT_RESEARCHER_URL || process.env.NEXT_PUBLIC_GPT_RESEARCHER_URL || 'ws://localhost:8000'

  return NextResponse.json(
    { url: wsUrl },
    { headers: { 'Cache-Control': 'no-store' } }
  )
}
