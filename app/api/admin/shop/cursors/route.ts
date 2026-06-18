// app/api/admin/shop/cursors/route.ts
// GET  /api/admin/shop/cursors → 全部鼠标效果（含禁用）
// POST /api/admin/shop/cursors → 新建鼠标效果
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { getAllCursorEffectsAdmin, createCursorEffect, type CursorEffectInput } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    await requireAdmin()
    const effects = await getAllCursorEffectsAdmin()
    return NextResponse.json({ effects })
  } catch (err) {
    console.error('[admin shop cursors GET]', err)
    return NextResponse.json({ error: '读取失败' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin()
    const body = (await req.json()) as Partial<CursorEffectInput>

    // 基础校验
    if (!body.key || !body.name) {
      return NextResponse.json({ error: 'key 和 name 必填' }, { status: 400 })
    }
    if (body.price == null || body.price < 0) {
      return NextResponse.json({ error: '价格必须 ≥ 0' }, { status: 400 })
    }
    if (!['common', 'rare', 'epic', 'legendary'].includes(body.rarity ?? '')) {
      return NextResponse.json({ error: '稀有度必须是 common/rare/epic/legendary' }, { status: 400 })
    }
    if (!['sprite_sheet', 'gif'].includes(body.render_type ?? '')) {
      return NextResponse.json({ error: 'render_type 必须是 sprite_sheet 或 gif' }, { status: 400 })
    }

    // GIF 模式：cols/rows/fps/frame_width/frame_height 用默认值（GIF 不走 SpriteCanvas）
    // sprite_sheet 模式：保留传入值，缺省用 codex-pets 规格
    const isGif = body.render_type === 'gif'
    const data: CursorEffectInput = {
      key: body.key,
      name: body.name,
      description: body.description ?? null,
      price: body.price,
      rarity: body.rarity!,
      sprite_url: body.sprite_url ?? null,
      cols: isGif ? 1 : (body.cols ?? 8),
      rows: isGif ? 1 : (body.rows ?? 9),
      fps: isGif ? 10 : (body.fps ?? 10),
      frame_width: isGif ? 192 : (body.frame_width ?? 192),
      frame_height: isGif ? 208 : (body.frame_height ?? 208),
      scale: body.scale ?? 96,
      follow_easing: body.follow_easing ?? 0.13,
      state_map: body.state_map ?? '{"idle":0,"runRight":1,"runLeft":2}',
      emoji: body.emoji ?? '👻',
      render_type: body.render_type!,
      poster_url: body.poster_url ?? null,
      enabled: body.enabled ?? true,
    }

    const effect = await createCursorEffect(data)
    return NextResponse.json({ success: true, effect })
  } catch (err) {
    const message = err instanceof Error ? err.message : '创建失败'
    console.error('[admin shop cursors POST]', err)
    // 唯一键冲突
    if (message.includes('duplicate') || message.includes('unique')) {
      return NextResponse.json({ error: 'key 已存在，请换一个' }, { status: 400 })
    }
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
