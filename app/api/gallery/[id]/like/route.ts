import { logFailure } from '@/lib/security/log'
import { withWriteGuard } from '@/lib/security/write-guard'
// app/api/gallery/[id]/like/route.ts
// 公开接口：图片点赞 +1（同一 IP 每分钟限 10 次；前端另有 localStorage 去重）
import { NextRequest, NextResponse } from 'next/server'
import { likeGalleryImage } from '@/lib/db'
import { clientIp } from '@/lib/rate-limit'
import { allowAuthAttempt } from '@/lib/auth-rate-limit'

export const dynamic = 'force-dynamic'

async function handlePOST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = Number(params.id)
    if (!Number.isSafeInteger(id) || id<=0) {
      return NextResponse.json({ error: '无效 ID' }, { status: 400 })
    }
    if (!await allowAuthAttempt(req,'gallery-like',clientIp(req))) return NextResponse.json({error:'操作太频繁，请稍后再试'},{status:429})
    const likes = await likeGalleryImage(id)
    return NextResponse.json({ success: true, likes })
  } catch (err) {
    if (err instanceof Error && err.message==='Gallery image not found') return NextResponse.json({error:'图片不存在'},{status:404})
    logFailure('app/api/gallery/[id]/like', err)
    return NextResponse.json({ error: '点赞失败' }, { status: 500 })
  }
}

export const POST = withWriteGuard(handlePOST)
