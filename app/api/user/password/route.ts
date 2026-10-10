import { logFailure } from '@/lib/security/log'
import { withWriteGuard } from '@/lib/security/write-guard'
// app/api/user/password/route.ts
// POST  → 发送验证码到用户邮箱
// PATCH → 验证码 + 新密码，完成修改
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { getUserById, setVerifyToken, getUserByVerifyTokenAndId, updateUserPassword } from '@/lib/db'
import { allowAuthAttempt, validNewPassword, MIN_PASSWORD_LENGTH } from '@/lib/auth-rate-limit'
import { Resend } from 'resend'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM   = process.env.EMAIL_FROM ?? 'MindStack <noreply@zshengzong.top>'

// ── POST：生成 6 位验证码，写入 verify_token，发送邮件 ─────────────────────────
async function handlePOST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: '请先登录' }, { status: 401 })

  const userId = Number((session.user as { id?: string }).id ?? 0)
  if (!userId) return NextResponse.json({ error: '无法识别用户' }, { status: 400 })

  if (!await allowAuthAttempt(req, 'password-send', String(userId))) {
    return NextResponse.json({ error: '发送过于频繁，请稍后再试' }, { status: 429, headers: { 'Retry-After': '3600' } })
  }
  const user = await getUserById(userId)
  if (!user) return NextResponse.json({ error: '用户不存在' }, { status: 404 })

  // GitHub OAuth 用户没有密码，不支持此功能
  if (!user.password) return NextResponse.json({ error: '第三方登录账号无法修改密码' }, { status: 400 })

  // 生成 6 位数字验证码，有效期 10 分钟
  const code    = crypto.randomInt(100000, 999999).toString()
  const expires = new Date(Date.now() + 10 * 60 * 1000)
  await setVerifyToken(userId, code, expires)

  const { error: sendError } = await resend.emails.send({
    from: FROM,
    to: user.email,
    subject: '【MindStack】修改密码验证码',
    html: `
      <div style="font-family:-apple-system,sans-serif;max-width:480px;margin:0 auto;padding:40px 24px;color:#111;">
        <div style="margin-bottom:28px;">
          <span style="font-size:11px;font-weight:800;letter-spacing:.2em;text-transform:uppercase;color:#2563eb;">MindStack</span>
          <h1 style="margin:8px 0 0;font-size:22px;font-weight:900;letter-spacing:-.03em;">修改密码验证码</h1>
        </div>
        <p style="color:#666;font-size:14px;line-height:1.6;margin-bottom:28px;">
          你正在修改账号密码，请使用以下验证码完成操作。验证码有效期 <strong>10 分钟</strong>，请勿泄露给他人。
        </p>
        <div style="background:#f4f7ff;border-radius:16px;padding:28px;text-align:center;margin-bottom:28px;">
          <span style="font-size:40px;font-weight:900;letter-spacing:.25em;color:#2563eb;">${code}</span>
        </div>
        <p style="color:#aaa;font-size:12px;">如果这不是你的操作，请忽略此邮件。你的密码不会发生任何变化。</p>
      </div>
    `,
  })

  if (sendError) {
    logFailure('app/api/user/password', sendError)
    return NextResponse.json({ error: '邮件发送失败，请稍后再试' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, email: user.email.replace(/(.{2}).+(@.+)/, '$1***$2') })
}

// ── PATCH：校验验证码，哈希新密码并写入 ─────────────────────────────────────────
async function handlePATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: '请先登录' }, { status: 401 })

  const userId = Number((session.user as { id?: string }).id ?? 0)
  if (!userId) return NextResponse.json({ error: '无法识别用户' }, { status: 400 })

  const { code, newPassword } = await req.json()

  if (typeof code !== 'string' || !/^\d{6}$/.test(code) || !validNewPassword(newPassword))
    return NextResponse.json({ error: '验证码或新密码不符合要求（密码至少 ' + MIN_PASSWORD_LENGTH + ' 位）' }, { status: 400 })
  if (!await allowAuthAttempt(req, 'password-verify', String(userId))) {
    return NextResponse.json({ error: '验证次数过多，请稍后重试' }, { status: 429, headers: { 'Retry-After': '1800' } })
  }

  // 用 token 查用户，同时做过期校验（SQL 里有 token_expires>NOW()）
  const user = await getUserByVerifyTokenAndId(code, userId)
  if (!user) {
    return NextResponse.json({ error: '验证码无效或已过期' }, { status: 400 })
  }

  const hashed = await bcrypt.hash(newPassword, 12)
  if (!await updateUserPassword(userId, hashed, code, user.password)) {
    return NextResponse.json({ error: '验证码已使用、过期或密码已更新' }, { status: 400 })
  }

  return NextResponse.json({ ok: true })
}

export const POST = withWriteGuard(handlePOST)
export const PATCH = withWriteGuard(handlePATCH)
