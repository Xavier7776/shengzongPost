import { logFailure } from '@/lib/security/log'
import { withWriteGuard } from '@/lib/security/write-guard'
// app/api/shop/frames/purchase/route.ts
// POST /api/shop/frames/purchase  body: { frameId: number }
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { purchaseFrame } from '@/lib/db'

async function handlePOST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: '请先登录' }, { status: 401 })

  const userId = Number((session.user as { id?: string }).id)
  if (!userId) return NextResponse.json({ error: '用户信息异常' }, { status: 400 })

  try {
    const { frameId } = await req.json()
    if (!frameId || typeof frameId !== 'number') {
      return NextResponse.json({ error: '参数错误' }, { status: 400 })
    }

    const result = await purchaseFrame(userId, frameId)
    return NextResponse.json({ ok: true, ...result })
  } catch (err) {
    const message = err instanceof Error && ['Frame not found','Cursor effect not found','Insufficient points','Frame not owned','Cursor effect not owned'].includes(err.message) ? err.message : '购买失败'
    logFailure('app/api/shop/frames/purchase', err)
    return NextResponse.json({ error: message }, { status: 400 })
  }
}

export const POST = withWriteGuard(handlePOST)
