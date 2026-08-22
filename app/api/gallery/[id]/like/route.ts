// app/api/gallery/[id]/like/route.ts
// 公开接口：图片点赞 +1（同一 IP 每分钟限 10 次；前端另有 localStorage 去重）
import { NextRequest, NextResponse } from 'next/server'
import { likeGalleryImage } from '@/lib/db'
import { rateLimit, clientIp } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!rateLimit(`gallery-like:${clientIp(req)}`, 10, 60_000)) {
    return NextResponse.json({ error: '操作太频繁，请稍后再试' }, { status: 429 })
  }
  try {
    const id = Number(params.id)
    if (!Number.isFinite(id)) {
      return NextResponse.json({ error: '无效 ID' }, { status: 400 })
    }
    const likes = await likeGalleryImage(id)
    return NextResponse.json({ success: true, likes })
  } catch (err) {
    console.error('[gallery/like]', err)
    return NextResponse.json({ error: '点赞失败' }, { status: 500 })
  }
}
