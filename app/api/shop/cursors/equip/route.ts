import { logFailure } from '@/lib/security/log'
import { withWriteGuard } from '@/lib/security/write-guard'
// app/api/shop/cursors/equip/route.ts
// POST /api/shop/cursors/equip  body: { effectId: number | null }
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { equipCursorEffect } from '@/lib/db'

async function handlePOST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: '请先登录' }, { status: 401 })

  const userId = Number((session.user as { id?: string }).id)
  if (!userId) return NextResponse.json({ error: '用户信息异常' }, { status: 400 })

  try {
    const { effectId } = await req.json()
    // effectId can be null (unequip) or a number (equip)
    if (effectId !== null && typeof effectId !== 'number') {
      return NextResponse.json({ error: '参数错误' }, { status: 400 })
    }

    await equipCursorEffect(userId, effectId)
    return NextResponse.json({ ok: true, equippedEffectId: effectId })
  } catch (err) {
    const message = err instanceof Error && ['Frame not found','Cursor effect not found','Insufficient points','Frame not owned','Cursor effect not owned'].includes(err.message) ? err.message : '操作失败'
    logFailure('app/api/shop/cursors/equip', err)
    return NextResponse.json({ error: message }, { status: 400 })
  }
}

export const POST = withWriteGuard(handlePOST)
