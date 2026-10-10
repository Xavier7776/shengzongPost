import { logFailure } from '@/lib/security/log'
import { isRasterImage } from '@/lib/security/image'
import { withWriteGuard } from '@/lib/security/write-guard'
// app/api/slides/upload/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/auth'
import { uploadLarge } from '@/lib/uploadLarge'

async function handlePOST(req: NextRequest) {
  const session = await requireAdminApi()
  if (!session) return NextResponse.json({ error: '无权限' }, { status: 401 })

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    if (!file || typeof file.arrayBuffer !== 'function') return NextResponse.json({ error: '请选择文件' }, { status: 400 })

    if (file.size > 10 * 1024 * 1024) return NextResponse.json({ error: '图片不能超过 10MB' }, { status: 400 })
    const buffer = Buffer.from(await file.arrayBuffer())
    if (!isRasterImage(buffer)) return NextResponse.json({ error: '文件不是支持的 JPG/PNG/WebP/GIF 图片' }, { status: 400 })

    const result = await uploadLarge(buffer, {
      folder:        'arc-portfolio/slides',
      resource_type: 'image',
    })

    return NextResponse.json({ ok: true, url: result.secure_url })
  } catch (err) {
    logFailure('app/api/slides/upload', err)
    return NextResponse.json({ error: '上传失败' }, { status: 500 })
  }
}

export const POST = withWriteGuard(handlePOST, { maxBytes: 11 * 1024 * 1024 })
