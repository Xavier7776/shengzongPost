import { logFailure } from '@/lib/security/log'
import { withWriteGuard } from '@/lib/security/write-guard'
// app/api/shop/cursors/purchase/route.ts
// POST /api/shop/cursors/purchase  body: { effectId: number }
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { purchaseCursorEffect } from '@/lib/db'

async function handlePOST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: '请先登录' }, { status: 401 })

  const userId = Number((session.user as { id?: string }).id)
  if (!userId) return NextResponse.json({ error: '用户信息异常' }, { status: 400 })

  try {
    const { effectId } = await req.json()
    if (!effectId || typeof effectId !== 'number') {
      return NextResponse.json({ error: '参数错误' }, { status: 400 })
    }

    const result = await purchaseCursorEffect(userId, effectId)
    return NextResponse.json({ ok: true, ...result })
  } catch (err) {
    const message = err instanceof Error && ['Frame not found','Cursor effect not found','Insufficient points','Frame not owned','Cursor effect not owned'].includes(err.message) ? err.message : '购买失败'
    logFailure('app/api/shop/cursors/purchase', err)
    return NextResponse.json({ error: message }, { status: 400 })
  }
}

export const POST = withWriteGuard(handlePOST)
