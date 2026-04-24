// app/api/user/forgot-password/route.ts
// POST  → 根据邮箱查用户，发送验证码
// PATCH → 验证码 + 邮箱 + 新密码，完成重置
import { NextRequest, NextResponse } from 'next/server'
import { getUserByEmail, setVerifyToken, getUserByVerifyToken, updateUserPassword } from '@/lib/db'
import { Resend } from 'resend'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM   = process.env.EMAIL_FROM ?? 'MindStack <noreply@zshengzong.top>'

export async function POST(req: NextRequest) {
  const { email } = await req.json()
  if (!email?.trim()) return NextResponse.json({ error: '请填写邮箱' }, { status: 400 })

  const user = await getUserByEmail(email.trim().toLowerCase())
  // 无论是否找到用户，都返回成功（防止枚举）
  if (!user || !user.password) {
    return NextResponse.json({ ok: true, email: email.replace(/(.{2}).+(@.+)/, '$1***$2') })
  }

  const code    = crypto.randomInt(100000, 999999).toString()
  const expires = new Date(Date.now() + 10 * 60 * 1000)
  await setVerifyToken(user.id, code, expires)

  await resend.emails.send({
    from: FROM,
    to: user.email,
    subject: '【MindStack】重置密码验证码',
    html: `
      <div style="font-family:-apple-system,sans-serif;max-width:480px;margin:0 auto;padding:40px 24px;color:#111;">
        <div style="margin-bottom:28px;">
          <span style="font-size:11px;font-weight:800;letter-spacing:.2em;text-transform:uppercase;color:#2563eb;">MindStack</span>
          <h1 style="margin:8px 0 0;font-size:22px;font-weight:900;letter-spacing:-.03em;">重置密码验证码</h1>
        </div>
        <p style="color:#666;font-size:14px;line-height:1.6;margin-bottom:28px;">
          你正在重置账号密码，请使用以下验证码完成操作。验证码有效期 <strong>10 分钟</strong>，请勿泄露给他人。
        </p>
        <div style="background:#f4f7ff;border-radius:16px;padding:28px;text-align:center;margin-bottom:28px;">
          <span style="font-size:40px;font-weight:900;letter-spacing:.25em;color:#2563eb;">${code}</span>
        </div>
        <p style="color:#aaa;font-size:12px;">如果这不是你的操作，请忽略此邮件。</p>
      </div>
    `,
  })

  return NextResponse.json({ ok: true, email: user.email.replace(/(.{2}).+(@.+)/, '$1***$2') })
}

export async function PATCH(req: NextRequest) {
  const { email, code, newPassword } = await req.json()
  if (!email || !code || !newPassword) return NextResponse.json({ error: '参数不完整' }, { status: 400 })
  if (newPassword.length < 8) return NextResponse.json({ error: '新密码至少 8 位' }, { status: 400 })

  const user = await getUserByVerifyToken(code)
  if (!user) return NextResponse.json({ error: '验证码无效或已过期' }, { status: 400 })

  // 双重验证：token 匹配的用户 email 必须与请求 email 一致
  if (user.email.toLowerCase() !== email.trim().toLowerCase()) {
    return NextResponse.json({ error: '验证码无效或已过期' }, { status: 400 })
  }

  const hashed = await bcrypt.hash(newPassword, 12)
  await updateUserPassword(user.id, hashed)

  return NextResponse.json({ ok: true })
}