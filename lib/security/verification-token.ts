import { createHmac } from 'node:crypto'

/** Purpose-separated HMAC also protects short numeric codes from an offline six-digit dictionary. */
export function verificationTokenHash(token: string) {
  const secret = process.env.NEXTAUTH_SECRET
  if (!secret) throw new Error('Verification requires NEXTAUTH_SECRET')
  const purpose = /^\d{6}$/.test(token) ? 'password-reset' : 'email-verification'
  return 'h1:' + createHmac('sha256', secret).update(purpose + '\0' + token).digest('hex')
}

export function passwordSessionStamp(id: number, passwordHash: string) {
  const secret = process.env.NEXTAUTH_SECRET
  if (!secret) throw new Error('Session validation requires NEXTAUTH_SECRET')
  return createHmac('sha256', secret).update('password-session\0' + id + '\0' + passwordHash).digest('hex')
}
