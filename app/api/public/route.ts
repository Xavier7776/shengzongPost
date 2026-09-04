// app/api/public/route.ts
// GET /api/public → 已废弃，兼容转发到 /api/posts/public
// 旧地址无任何前端调用方，保留转发是为了不破坏外部/书签引用。确认无流量后可整体删除。
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const target = new URL('/api/posts/public', request.url)
  return NextResponse.redirect(target, 307)
}
