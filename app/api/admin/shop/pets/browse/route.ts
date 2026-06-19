// GET /api/admin/shop/pets/browse?page=1&pageSize=20&search=
// 从 codex-pets.net 浏览可用宠物
// 代理模式：避免浏览器端 CORS 问题，服务端转发并过滤掉不必要的字段
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'

export const dynamic = 'force-dynamic'
const API_BASE = 'https://codex-pets.net'

export async function GET(req: NextRequest) {
  try {
    await requireAdmin()
    const url = new URL(req.url)
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'))
    const pageSize = Math.min(50, Math.max(5, parseInt(url.searchParams.get('pageSize') || '20')))
    const search = url.searchParams.get('search') || ''

    let apiUrl = `${API_BASE}/api/pets?page=${page}&pageSize=${pageSize}`
    if (search) apiUrl += `&search=${encodeURIComponent(search)}`

    const res = await fetch(apiUrl, { cache: 'no-store' })
    if (!res.ok) throw new Error(`codex-pets API ${res.status}`)
    const json = await res.json()
    const list: any[] = json.pets || json.data || []

    // 过滤只返回前端需要的字段
    const pets = list.map(p => ({
      id: p.id,
      displayName: p.displayName || p.name || p.id,
      description: p.description ? String(p.description).slice(0, 150) : '',
      kind: p.kind || '',
      tags: (p.tags || []).slice(0, 5),
      spritesheetUrl: p.spritesheetUrl,
      posterUrl: p.posterUrl,
      previewUrl: p.previewUrl,
      viewCount: p.viewCount ?? 0,
      likeCount: p.likeCount ?? 0,
      cellSize: p.validationReport?.cellSize,
      hasSpritesheet: !!p.spritesheetUrl,
      hasPoster: !!p.posterUrl,
      ownerHandle: p.ownerHandle || '',
      ownerName: p.ownerName || '',
      ownerAvatarUrl: p.ownerAvatarUrl || null,
    }))

    return NextResponse.json({
      pets,
      total: json.total ?? pets.length,
      totalPages: json.totalPages ?? 1,
      page,
      pageSize,
    })
  } catch (err) {
    console.error('[admin pets browse]', err)
    const msg = err instanceof Error ? err.message : '未知错误'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
