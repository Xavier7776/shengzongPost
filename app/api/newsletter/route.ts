import { logFailure } from '@/lib/security/log'
import { withWriteGuard } from '@/lib/security/write-guard'
// app/api/newsletter/route.ts
// POST /api/newsletter { email } → 订阅（IP 限流 + 邮箱校验 + 幂等）
import { NextRequest, NextResponse } from 'next/server'
import { subscribeNewsletter } from '@/lib/db'
import { allowAuthAttempt, normalizeEmail } from '@/lib/auth-rate-limit'

async function handlePOST(req: NextRequest) {
  try {
    const body = await req.json()
    const email = normalizeEmail(body?.email)
    if (!email) {
      return NextResponse.json({ error: '请输入有效的邮箱地址' }, { status: 400 })
    }
    if (!await allowAuthAttempt(req,'newsletter',email)) return NextResponse.json({error:'操作太频繁，请稍后再试'},{status:429})
    const { alreadySubscribed } = await subscribeNewsletter(email)
    return NextResponse.json({ ok: true, message: alreadySubscribed ? '这个邮箱已经订阅过啦' : '订阅成功，感谢关注！' })
  } catch (err) {
    logFailure('app/api/newsletter', err)
    return NextResponse.json({ error: '订阅失败，请稍后再试' }, { status: 500 })
  }
}

export const POST = withWriteGuard(handlePOST, { maxBytes: 4 * 1024 })
