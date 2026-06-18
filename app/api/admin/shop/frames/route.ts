// app/api/admin/shop/frames/route.ts
// GET  /api/admin/shop/frames → 全部头像框（含禁用）
// POST /api/admin/shop/frames → 新建头像框
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { getAllFramesAdmin, createFrame, type AvatarFrameInput } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    await requireAdmin()
    const frames = await getAllFramesAdmin()
    return NextResponse.json({ frames })
  } catch (err) {
    console.error('[admin shop frames GET]', err)
    return NextResponse.json({ error: '读取失败' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin()
    const body = (await req.json()) as Partial<AvatarFrameInput>

    if (!body.key || !body.name || !body.css_key) {
      return NextResponse.json({ error: 'key、name、css_key 必填' }, { status: 400 })
    }
    if (body.price == null || body.price < 0) {
      return NextResponse.json({ error: '价格必须 ≥ 0' }, { status: 400 })
    }
    if (!['common', 'rare', 'epic', 'legendary'].includes(body.rarity ?? '')) {
      return NextResponse.json({ error: '稀有度必须是 common/rare/epic/legendary' }, { status: 400 })
    }

    const data: AvatarFrameInput = {
      key: body.key,
      name: body.name,
      description: body.description ?? null,
      price: body.price,
      rarity: body.rarity!,
      css_key: body.css_key,
      enabled: body.enabled ?? true,
    }

    const frame = await createFrame(data)
    return NextResponse.json({ success: true, frame })
  } catch (err) {
    const message = err instanceof Error ? err.message : '创建失败'
    console.error('[admin shop frames POST]', err)
    if (message.includes('duplicate') || message.includes('unique')) {
      return NextResponse.json({ error: 'key 已存在，请换一个' }, { status: 400 })
    }
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
