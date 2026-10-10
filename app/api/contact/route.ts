import { logFailure } from '@/lib/security/log'
import { normalizeEmail, allowAuthAttempt } from '@/lib/auth-rate-limit'
import { escapeHtml } from '@/lib/security/text'
import { withWriteGuard } from '@/lib/security/write-guard'
// app/api/contact/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

async function handlePOST(req: NextRequest) {
  const resend = new Resend(process.env.RESEND_API_KEY)
  try {
    const input = await req.json()
    const name = typeof input.name === 'string' ? input.name.trim() : ''
    const email = normalizeEmail(input.email)
    const message = typeof input.message === 'string' ? input.message.trim() : ''

    if (!name || name.length > 60 || !email || !message || message.length > 10000) {
      return NextResponse.json({ error: '请填写所有必填字段' }, { status: 400 })
    }

    if (!await allowAuthAttempt(req, 'contact', email)) return NextResponse.json({ error: '发送太频繁，请稍后重试' }, { status: 429 })
    const { error: sendError } = await resend.emails.send({
      from: 'Xavier <Xavier@zshengzong.top>',
      to: '1808571411@qq.com',
      replyTo: email,
      subject: `[ARC Portfolio] 新消息来自 ${name}`,
      html: `
        <div style="font-family: -apple-system, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 24px; color: #111;">
          <div style="margin-bottom: 32px;">
            <span style="font-size: 11px; font-weight: 800; letter-spacing: 0.2em; text-transform: uppercase; color: #2563eb;">ARC Portfolio</span>
            <h1 style="margin: 8px 0 0; font-size: 24px; font-weight: 900; letter-spacing: -0.03em;">收到一条新消息</h1>
          </div>

          <div style="background: #f9f9f7; border-radius: 16px; padding: 24px; margin-bottom: 24px;">
            <div style="margin-bottom: 16px;">
              <span style="font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.15em; color: #9ca3af;">发件人</span>
              <p style="margin: 4px 0 0; font-size: 16px; font-weight: 700;">${escapeHtml(name)}</p>
            </div>
            <div>
              <span style="font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.15em; color: #9ca3af;">邮箱</span>
              <p style="margin: 4px 0 0; font-size: 15px;">
                <a href="mailto:${escapeHtml(email)}" style="color: #2563eb; text-decoration: none;">${escapeHtml(email)}</a>
              </p>
            </div>
          </div>

          <div style="background: #fff; border: 1px solid #e5e7eb; border-radius: 16px; padding: 24px; margin-bottom: 32px;">
            <span style="font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.15em; color: #9ca3af;">留言内容</span>
            <p style="margin: 12px 0 0; font-size: 15px; line-height: 1.8; color: #374151; white-space: pre-wrap;">${escapeHtml(message)}</p>
          </div>

          <a href="mailto:${escapeHtml(email)}"
             style="display: inline-block; background: #2563eb; color: #fff; padding: 14px 28px; border-radius: 12px; font-weight: 700; font-size: 14px; text-decoration: none;">
            直接回复
          </a>

          <p style="margin-top: 40px; font-size: 12px; color: #9ca3af;">此邮件由 zshengzong.top 自动发送</p>
        </div>
      `,
    })

    if (sendError) {
      logFailure('app/api/contact', sendError)
      return NextResponse.json({ error: '邮件发送失败，请稍后再试' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    logFailure('app/api/contact', err)
    return NextResponse.json({ error: '发送失败，请稍后重试' }, { status: 500 })
  }
}
export const POST = withWriteGuard(handlePOST)
