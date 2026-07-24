// app/api/auth/verify/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getUserByVerifyToken, markUserVerified } from '@/lib/db'

// 邮箱验证回调路由：未调用 cookies/headers 等动态 API，需显式声明动态
// 否则 Next.js 可能缓存带 token 的重定向响应，导致后续用户验证失败
export const dynamic = 'force-dynamic'

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
