import { logFailure } from '@/lib/security/log'
import { withWriteGuard } from '@/lib/security/write-guard'
// Password reset: account-bound code + durable rate limiting (Neon migration 055).
import { NextRequest, NextResponse } from 'next/server'
import { getUserByEmail, setVerifyToken, getUserByVerifyTokenAndEmail, updateUserPassword } from '@/lib/db'
import { allowAuthAttempt, normalizeEmail, validNewPassword, MIN_PASSWORD_LENGTH } from '@/lib/auth-rate-limit'
import { Resend } from 'resend'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = process.env.EMAIL_FROM ?? 'MindStack <noreply@zshengzong.top>'
const masked = (email: string) => email.replace(/(.{2}).+(@.+)/, '$1***$2')
const codePattern = /^\d{6}$/

async function handlePOST(req: NextRequest) {
  const input = await req.json().catch(() => ({}))
  const email = normalizeEmail(input?.email)
  if (!email) return NextResponse.json({ error: '请输入有效邮箱' }, { status: 400 })
  try {
    if (!await allowAuthAttempt(req, 'forgot-send', email)) {
      return NextResponse.json({ error: '操作太频繁，请稍后再试' }, { status: 429, headers: { 'Retry-After': '3600' } })
    }
    const user = await getUserByEmail(email)
    // Use the same response for nonexistent/third-party accounts to avoid enumeration.
    if (user?.password) {
      const code = crypto.randomInt(100000, 1000000).toString()
      await setVerifyToken(user.id, code, new Date(Date.now() + 10 * 60_000))
      const { error } = await resend.emails.send({
        from: FROM, to: user.email, subject: '【MindStack】重置密码验证码',
        html: '<p>请使用下方验证码重置密码（10 分钟有效）：</p><p style="font-size:28px;font-weight:bold;letter-spacing:0.15em">' +
          code + '</p><p>如果不是你本人操作，请忽略本邮件。</p>',
      })
      if (error) logFailure('app/api/user/forgot-password', error)
    }
    return NextResponse.json({ ok: true, email: masked(email) })
  } catch (error) {
    logFailure('app/api/user/forgot-password', error)
    return NextResponse.json({ error: '暂不可用，请稍后再试' }, { status: 503 })
  }
}

async function handlePATCH(req: NextRequest) {
  const input = await req.json().catch(() => ({}))
  const email = normalizeEmail(input?.email)
  const code = input?.code
  const password = input?.newPassword
  if (!email || typeof code !== 'string' || !codePattern.test(code) || !validNewPassword(password)) {
    return NextResponse.json({ error: '邮箱、六位验证码或新密码无效（密码至少 ' + MIN_PASSWORD_LENGTH + ' 位）' }, { status: 400 })
  }
  try {
    if (!await allowAuthAttempt(req, 'forgot-verify', email)) {
      return NextResponse.json({ error: '验证次数过多，请稍后重试' }, { status: 429, headers: { 'Retry-After': '1800' } })
    }
    const user = await getUserByVerifyTokenAndEmail(code, email)
    if (!user) return NextResponse.json({ error: '验证码无效或已过期' }, { status: 400 })
    if (!await updateUserPassword(user.id, await bcrypt.hash(password, 12), code, user.password)) {
      return NextResponse.json({ error: '验证码已使用、过期或密码已更新' }, { status: 400 })
    }
    return NextResponse.json({ ok: true })
  } catch (error) {
    logFailure('app/api/user/forgot-password', error)
    return NextResponse.json({ error: '暂不可用，请稍后再试' }, { status: 503 })
  }
}

export const POST = withWriteGuard(handlePOST)
export const PATCH = withWriteGuard(handlePATCH)
