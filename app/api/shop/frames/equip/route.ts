// app/api/shop/frames/equip/route.ts
// POST /api/shop/frames/equip  body: { frameId: number | null }
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { equipFrame } from '@/lib/db'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: '请先登录' }, { status: 401 })

  const userId = Number((session.user as { id?: string }).id)
  if (!userId) return NextResponse.json({ error: '用户信息异常' }, { status: 400 })

  try {
    const { frameId } = await req.json()
    // frameId can be null (unequip) or a number (equip)
    if (frameId !== null && typeof frameId !== 'number') {
      return NextResponse.json({ error: '参数错误' }, { status: 400 })
    }

    await equipFrame(userId, frameId)
    return NextResponse.json({ ok: true, equippedFrameId: frameId })
  } catch (err) {
    const message = err instanceof Error ? err.message : '操作失败'
    console.error('[shop equip]', err)
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
