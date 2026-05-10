'use server'

// app/onlyus/gate/actions.ts

import { cookies } from 'next/headers'
import { createHash } from 'crypto'
import { signGateToken, COOKIE_NAME } from '@/lib/onlyus-gate'

export async function verifyPasscode(
  passcode: string
): Promise<{ ok: boolean; error?: string }> {
  if (!passcode || typeof passcode !== 'string') {
    return { ok: false, error: 'invalid' }
  }

  const expectedHash = process.env.ONLYUS_PASSCODE_HASH
  if (!expectedHash) {
    console.error('[gate] ONLYUS_PASSCODE_HASH is not set')
    return { ok: false, error: 'server_error' }
  }

  const inputHash = createHash('sha256').update(passcode.trim()).digest('hex')
  const match = inputHash === expectedHash

  if (!match) {
    return { ok: false, error: 'wrong' }
  }

  const token = await signGateToken()

  cookies().set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/onlyus',
    maxAge: 60 * 60 * 24 * 7,
  })

  return { ok: true }
}