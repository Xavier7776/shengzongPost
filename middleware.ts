// middleware.ts
// 合并了原有 Supabase session 刷新 + OnlyUs gate 校验

import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { verifyGateToken, COOKIE_NAME } from '@/lib/onlyus-gate'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  let response = NextResponse.next({ request })

  if (pathname.startsWith('/onlyus')) {
    // ── 1. Supabase session 刷新（保留原有逻辑）──
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return request.cookies.getAll() },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
            response = NextResponse.next({ request })
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            )
          },
        },
      }
    )
    await supabase.auth.getUser()

    // ── 2. Gate 校验 ──
    // /onlyus/gate 本身放行，否则死循环
    if (!pathname.startsWith('/onlyus/gate')) {
      const token = request.cookies.get(COOKIE_NAME)?.value

      const passed = token ? await verifyGateToken(token) : false

      if (!passed) {
        // 保存原始目标路径，验证成功后可跳回
        const gateUrl = new URL('/onlyus/gate', request.url)
        gateUrl.searchParams.set('from', pathname)
        return NextResponse.redirect(gateUrl)
      }
    }
  }

  return response
}

export const config = {
  matcher: ['/onlyus/:path*'],
}
