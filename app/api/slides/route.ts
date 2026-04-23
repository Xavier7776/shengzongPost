// app/api/slides/route.ts
// GET  /api/slides          → 所有 slides（管理员）或仅 enabled（公开）
// POST /api/slides          → 创建 slide（管理员）

import { NextRequest, NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/auth'
import { getAllHeroSlides, getEnabledHeroSlides, createHeroSlide } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const isAdmin = req.nextUrl.searchParams.get('admin') === '1'

  try {
    if (isAdmin) {
      // 管理员：需要鉴权，返回全部
      const session = await requireAdminApi()
      if (!session) return NextResponse.json({ error: '无权限' }, { status: 401 })
      return NextResponse.json(await getAllHeroSlides())
    }
    // 公开：只返回已启用的
    return NextResponse.json(await getEnabledHeroSlides())
  } catch (err) {
    console.error('[slides GET]', err)
    return NextResponse.json({ error: '读取失败' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await requireAdminApi()
  if (!session) return NextResponse.json({ error: '无权限' }, { status: 401 })

  try {
    const { img, title, subtitle, sort_order } = await req.json()
    if (!img?.trim() || !title?.trim() || !subtitle?.trim())
      return NextResponse.json({ error: '图片 URL、标题和描述不能为空' }, { status: 400 })

    const slide = await createHeroSlide({ img: img.trim(), title: title.trim(), subtitle: subtitle.trim(), sort_order })
    return NextResponse.json({ ok: true, slide })
  } catch (err) {
    console.error('[slides POST]', err)
    return NextResponse.json({ error: '创建失败' }, { status: 500 })
  }
}
