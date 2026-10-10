import { logFailure } from '@/lib/security/log'
import { allowAuthAttempt } from '@/lib/auth-rate-limit'
import { isRasterImage } from '@/lib/security/image'
import { withWriteGuard } from '@/lib/security/write-guard'
// app/api/user/upload/route.ts
// POST /api/user/upload  → 登录用户上传图片到 Cloudinary（供编辑请求使用）
// 统一走 lib/uploadLarge（分片上传 + 重试），与其他上传接口保持一致

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { uploadLarge } from '@/lib/uploadLarge'

async function handlePOST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: '请先登录' }, { status: 401 })

  if (!await allowAuthAttempt(req, 'upload', String((session.user as { id?: string }).id))) return NextResponse.json({ error: '操作太频繁，请稍后重试' }, { status: 429 })

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    if (!file || typeof file.arrayBuffer !== 'function') return NextResponse.json({ error: '请选择文件' }, { status: 400 })
    if (file.size > 10 * 1024 * 1024)
      return NextResponse.json({ error: '图片不能超过 10MB' }, { status: 400 })

    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowed.includes(file.type))
      return NextResponse.json({ error: '仅支持 JPG/PNG/WebP/GIF' }, { status: 400 })

    const buffer = Buffer.from(await file.arrayBuffer())
    if (!isRasterImage(buffer)) return NextResponse.json({ error: '文件不是支持的 JPG/PNG/WebP/GIF 图片' }, { status: 400 })
    const result = await uploadLarge(buffer, {
      folder:        'arc-portfolio/user-uploads',
      resource_type: 'image',
    })

    return NextResponse.json({ ok: true, url: result.secure_url })
  } catch (err) {
    logFailure('app/api/user/upload', err)
    return NextResponse.json({ error: '上传失败' }, { status: 500 })
  }
}

export const POST = withWriteGuard(handlePOST, { maxBytes: 11 * 1024 * 1024 })
