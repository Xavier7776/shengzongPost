// app/api/auth/verify/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getUserByVerifyToken, markUserVerified } from '@/lib/db'

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')

  if (!token) {
    return NextResponse.redirect(new URL('/verify?status=invalid', req.url))
  }

  try {
    const user = await getUserByVerifyToken(token)

    if (!user) {
      // token 不存在或已过期
      return NextResponse.redirect(new URL('/verify?status=expired', req.url))
    }

    if (user.verified) {
      // 已经验证过了
      return NextResponse.redirect(new URL('/verify?status=already', req.url))
    }

    await markUserVerified(user.id)
    return NextResponse.redirect(new URL('/verify?status=success', req.url))
  } catch (err) {
    console.error('[verify]', err)
    return NextResponse.redirect(new URL('/verify?status=error', req.url))
  }
}
