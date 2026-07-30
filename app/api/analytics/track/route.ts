// app/api/analytics/track/route.ts
// POST /api/analytics/track  → 上报一次页面访问（前端 AnalyticsTracker 调用，匿名可用）
// 不需要登录认证；返回 204 无内容
import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { trackVisitor } from '@/lib/db'

// 从请求头中提取真实 IP（兼容常见反代）
function getClientIp(req: NextRequest): string | null {
  const headers = req.headers
  // 常见反代头：x-forwarded-for / x-real-ip / cf-connecting-ip
  const xff = headers.get('x-forwarded-for')
  if (xff) {
    // x-forwarded-for 可能为 "client, proxy1, proxy2"，取第一个
    return xff.split(',')[0].trim()
  }
  return headers.get('x-real-ip') || headers.get('cf-connecting-ip') || null
}

// IP 哈希（SHA-256，加盐，避免反查原始 IP；只存哈希用于去重统计）
function hashIp(ip: string | null): string | null {
  if (!ip) return null
  // 加盐，降低彩虹表攻击风险；盐值不敏感，仅为避免与公开哈希库匹配
  const salt = process.env.ANALYTICS_IP_SALT || 'mindstack-analytics-salt'
  return createHash('sha256').update(`${salt}:${ip}`).digest('hex').slice(0, 32)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const { path, referrer, sessionId, visitorId, isLoggedIn } = body as {
      path?: unknown
      referrer?: unknown
      sessionId?: unknown
      visitorId?: unknown
      isLoggedIn?: unknown
    }

    // 参数校验：path 和 sessionId/visitorId 为必填
    if (typeof path !== 'string' || !path || typeof sessionId !== 'string' || !sessionId || typeof visitorId !== 'string' || !visitorId) {
      return new NextResponse(null, { status: 204 })
    }

    // 截断超长字段，避免 DB 列长度溢出
    const safePath = path.slice(0, 500)
    const safeReferrer = typeof referrer === 'string' ? referrer.slice(0, 500) : null
    const safeVisitorId = visitorId.slice(0, 64)
    const safeSessionId = sessionId.slice(0, 64)
    const userAgent = (req.headers.get('user-agent') || '').slice(0, 500) || null
    const ipHash = hashIp(getClientIp(req))

    // 服务端再校验一次登录状态（前端可能未传或失真）
    let isLoggedInServer = false
    try {
      const session = await getServerSession(authOptions)
      if (session?.user) isLoggedInServer = true
    } catch {
      // 静默：未登录也正常追踪
    }
    const isLoggedInBool = isLoggedInServer || isLoggedIn === true

    await trackVisitor({
      visitor_id: safeVisitorId,
      session_id: safeSessionId,
      path: safePath,
      referrer: safeReferrer,
      user_agent: userAgent,
      ip_hash: ipHash,
      country: null, // 初期不解析国家，预留字段
      is_logged_in: isLoggedInBool,
    })

    return new NextResponse(null, { status: 204 })
  } catch (err) {
    // 追踪失败不应影响用户浏览，静默返回 204
    console.error('[analytics/track]', err)
    return new NextResponse(null, { status: 204 })
  }
}
