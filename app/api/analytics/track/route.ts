import { logFailure } from '@/lib/security/log'
import { withWriteGuard } from '@/lib/security/write-guard'
// app/api/analytics/track/route.ts
// POST /api/analytics/track  → 上报一次页面访问（前端 AnalyticsTracker 调用，匿名可用）
// 不需要登录认证；返回 204 无内容
import { NextRequest, NextResponse } from 'next/server'
import { createHmac } from 'crypto'
import { allowAuthAttempt } from '@/lib/auth-rate-limit'
import { clientIp } from '@/lib/rate-limit'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { trackVisitor } from '@/lib/db'

async function handlePOST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const { path, referrer, sessionId, visitorId } = body as {
      path?: unknown
      referrer?: unknown
      sessionId?: unknown
      visitorId?: unknown
    }

    // 参数校验：path 和 sessionId/visitorId 为必填
    const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (typeof path !== 'string' || !path.startsWith('/') || path.startsWith('//') || typeof sessionId !== 'string' || !uuid.test(sessionId) || typeof visitorId !== 'string' || !uuid.test(visitorId)) {
      return new NextResponse(null, { status: 204 })
    }

    const safePath = new URL(path,'https://analytics.invalid').pathname.slice(0,500)
    if (/^\/(api|admin|dashboard|profile|onlyus|login|register|forgot-password|reset-password)(\/|$)/i.test(safePath)) return new NextResponse(null,{status:204})
    if (!await allowAuthAttempt(req,'analytics',visitorId)) return new NextResponse(null,{status:204})
    let safeReferrer: string | null = null
    if (typeof referrer==='string' && referrer) {
      try {const source=new URL(referrer);if(['https:','http:'].includes(source.protocol)&&!source.username&&!source.password)safeReferrer=source.origin.slice(0,500)} catch {}
    }
    const secret=process.env.ANALYTICS_IP_SALT || process.env.NEXTAUTH_SECRET
    const ip=clientIp(req)
    const ipHash=secret && ip!=='unknown' ? createHmac('sha256',secret).update(new Date().toISOString().slice(0,10)+'\0'+ip).digest('hex').slice(0,32) : null

    // 服务端再校验一次登录状态（前端可能未传或失真）
    let isLoggedInServer = false
    try {
      const session = await getServerSession(authOptions)
      if (session?.user) isLoggedInServer = true
    } catch {
      // 静默：未登录也正常追踪
    }

    await trackVisitor({
      visitor_id: visitorId,
      session_id: sessionId,
      path: safePath,
      referrer: safeReferrer,
      user_agent: null,
      ip_hash: ipHash,
      country: null, // 初期不解析国家，预留字段
      is_logged_in: isLoggedInServer,
    })

    return new NextResponse(null, { status: 204 })
  } catch (err) {
    // 追踪失败不应影响用户浏览，静默返回 204
    logFailure('app/api/analytics/track', err)
    return new NextResponse(null, { status: 204 })
  }
}

export const POST = withWriteGuard(handlePOST, { maxBytes: 16 * 1024 })
