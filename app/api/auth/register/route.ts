// Register a new account with the same password policy used by reset endpoints.
import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { getUserByEmail, createUser, setVerifyToken } from '@/lib/db'
import { sendVerificationEmail } from '@/lib/email'
import { allowAuthAttempt, normalizeEmail, validNewPassword, MIN_PASSWORD_LENGTH, MAX_PASSWORD_LENGTH } from '@/lib/auth-rate-limit'

export async function POST(req: NextRequest) {
  let data: Record<string, unknown>
  try { data = await req.json() } catch { return NextResponse.json({ error: '无效的 JSON' }, { status: 400 }) }
  const email = normalizeEmail(data?.email)
  const name = typeof data?.name === 'string' ? data.name.trim() : ''
  if (!email || !name || name.length > 60) {
    return NextResponse.json({ error: '请输入有效邮箱及昵称' }, { status: 400 })
  }
  if (!validNewPassword(data?.password)) {
    return NextResponse.json({ error: '密码需为 ' + MIN_PASSWORD_LENGTH + '–' + MAX_PASSWORD_LENGTH + ' 字符，且 UTF-8 不超过 72 字节' }, { status: 400 })
  }
  try {
    if (!await allowAuthAttempt(req, 'registration', email)) {
      return NextResponse.json({ error: '请求太频繁，请稍后再试' }, { status: 429, headers: { 'Retry-After': '3600' } })
    }
    if (await getUserByEmail(email)) return NextResponse.json({ error: '该邮箱已注册' }, { status: 409 })
    const hashed = await bcrypt.hash(data.password, 12)
    const user = await createUser({ email, name, password: hashed })
    const token = crypto.randomBytes(32).toString('hex')
    await setVerifyToken(user.id, token, new Date(Date.now() + 24 * 3600_000))
    await sendVerificationEmail(email, name, token)
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[register]', error)
    return NextResponse.json({ error: '注册暂不可用，请稍后再试' }, { status: 503 })
  }
}
