// app/api/newsletter/route.ts
// POST /api/newsletter { email } → 订阅（IP 限流 + 邮箱校验 + 幂等）
import { NextRequest, NextResponse } from 'next/server'
import { subscribeNewsletter } from '@/lib/db'
import { rateLimit, clientIp } from '@/lib/rate-limit'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export async function POST(req: NextRequest) {
  if (!rateLimit(`newsletter:${clientIp(req)}`, 5, 60_000)) {
    return NextResponse.json({ error: '操作太频繁，请稍后再试' }, { status: 429 })
  }
  try {
    const body = await req.json()
    const email = String(body?.email ?? '').trim().toLowerCase()
    if (!EMAIL_RE.test(email) || email.length > 254) {
      return NextResponse.json({ error: '请输入有效的邮箱地址' }, { status: 400 })
    }
    const { alreadySubscribed } = await subscribeNewsletter(email)
    return NextResponse.json({ ok: true, message: alreadySubscribed ? '这个邮箱已经订阅过啦' : '订阅成功，感谢关注！' })
  } catch (err) {
    console.error('[newsletter]', err)
    return NextResponse.json({ error: '订阅失败，请稍后再试' }, { status: 500 })
  }
}
