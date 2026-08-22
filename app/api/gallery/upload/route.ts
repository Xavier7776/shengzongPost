// app/api/gallery/upload/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { createGalleryImage } from '@/lib/db'
import { uploadLarge } from '@/lib/uploadLarge'

export async function POST(req: NextRequest) {
  try {
    await requireAdmin()

    const formData    = await req.formData()
    const file        = formData.get('file')        as File   | null
    const title       = (formData.get('title')       as string) || ''
    const category    = (formData.get('category')    as string) || ''
    const description = (formData.get('description') as string) || ''
    const tagsRaw     = (formData.get('tags')        as string) || ''
    const tags        = tagsRaw.split(/[,，\s]+/).map(t => t.trim()).filter(Boolean).slice(0, 10)

    if (!file) return NextResponse.json({ error: '请选择文件' }, { status: 400 })

    const buffer = Buffer.from(await file.arrayBuffer())

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
    console.error('[gallery/upload]', err)
    return NextResponse.json({ error: '上传失败' }, { status: 500 })
  }
}
