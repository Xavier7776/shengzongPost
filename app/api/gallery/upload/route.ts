import { logFailure } from '@/lib/security/log'
import { isRasterImage } from '@/lib/security/image'
import { withWriteGuard } from '@/lib/security/write-guard'
// app/api/gallery/upload/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/auth'
import { createGalleryImage } from '@/lib/db'
import { uploadLarge } from '@/lib/uploadLarge'

async function handlePOST(req: NextRequest) {
  try {
    if (!await requireAdminApi()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const formData    = await req.formData()
    const file        = formData.get('file')        as File   | null
    const title       = (formData.get('title')       as string) || ''
    const category    = (formData.get('category')    as string) || ''
    const description = (formData.get('description') as string) || ''
    const tagsRaw     = (formData.get('tags')        as string) || ''
    const tags        = tagsRaw.split(/[,，\s]+/).map(t => t.trim()).filter(Boolean).slice(0, 10)

    if (!file || typeof file.arrayBuffer !== 'function') return NextResponse.json({ error: '请选择文件' }, { status: 400 })

    if (file.size > 10 * 1024 * 1024) return NextResponse.json({ error: '图片不能超过 10MB' }, { status: 400 })
    const buffer = Buffer.from(await file.arrayBuffer())
    if (!isRasterImage(buffer)) return NextResponse.json({ error: '文件不是支持的 JPG/PNG/WebP/GIF 图片' }, { status: 400 })

    const result = await uploadLarge(buffer, {
      folder:        'arc-portfolio/gallery',
      resource_type: 'image',
    })

    const image = await createGalleryImage({
      url:         result.secure_url,
      public_id:   result.public_id,
      title,
      category,
      description,
      tags,
      width:       result.width,
      height:      result.height,
    })

    return NextResponse.json({ success: true, image })
  } catch (err) {
    logFailure('app/api/gallery/upload', err)
    return NextResponse.json({ error: '上传失败' }, { status: 500 })
  }
}

export const POST = withWriteGuard(handlePOST, { maxBytes: 11 * 1024 * 1024 })
