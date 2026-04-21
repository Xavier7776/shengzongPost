// app/api/auth/dev-bypass/route.ts
// 仅开发环境使用，生产环境直接返回 403
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST() {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  cookies().set('dev-admin-bypass', '1', {
    httpOnly: true,
    path: '/',
    // 开发环境不需要 secure
    sameSite: 'lax',
    maxAge: 60 * 60 * 24, // 24小时
  })

  return NextResponse.json({ ok: true })
}
