// lib/email.ts
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM = 'Xavier <Xavier@zshengzong.top>'
const BASE_URL = process.env.NEXTAUTH_URL?.replace(/\/$/, '') ?? 'https://zshengzong.top'

export async function sendVerificationEmail(to: string, name: string, token: string) {
  const link = `${BASE_URL}/api/auth/verify?token=${token}`

  const { error } = await resend.emails.send({
    from: FROM,
    to,
    subject: '验证你的 ARC. 账号',
    html: `
      <div style="font-family: -apple-system, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 24px; color: #111;">
        <div style="margin-bottom: 32px;">
          <span style="font-size: 11px; font-weight: 800; letter-spacing: 0.2em; text-transform: uppercase; color: #2563eb;">ARC Portfolio</span>
          <h1 style="margin: 8px 0 0; font-size: 24px; font-weight: 900; letter-spacing: -0.03em;">验证你的邮箱</h1>
        </div>

        <div style="background: #f9f9f7; border-radius: 16px; padding: 24px; margin-bottom: 24px;">
          <p style="margin: 0; font-size: 15px; line-height: 1.8; color: #374151;">
            你好 <strong>${name}</strong>，<br/>
            感谢注册 ARC.，点击下方按钮完成邮箱验证。
          </p>
        </div>

        <a href="${link}"
           style="display: inline-block; background: #2563eb; color: #fff; padding: 14px 32px; border-radius: 12px; font-weight: 700; font-size: 15px; text-decoration: none; letter-spacing: -0.01em;">
          验证邮箱
        </a>

        <p style="margin-top: 24px; font-size: 13px; color: #6b7280;">
          链接 24 小时内有效。如果你没有注册过 ARC.，请忽略此邮件。
        </p>

        <hr style="margin: 32px 0; border: none; border-top: 1px solid #e5e7eb;" />

        <p style="font-size: 12px; color: #9ca3af;">
          如果按钮无法点击，请复制以下链接到浏览器：<br/>
          <a href="${link}" style="color: #2563eb; word-break: break-all;">${link}</a>
        </p>

        <p style="margin-top: 32px; font-size: 12px; color: #9ca3af;">此邮件由 zshengzong.top 自动发送</p>
      </div>
    `,
  })

  if (error) throw new Error(error.message)
}
