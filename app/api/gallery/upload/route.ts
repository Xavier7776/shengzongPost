// app/api/gallery/upload/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { createGalleryImage } from '@/lib/db'
import { v2 as cloudinary } from 'cloudinary'

function getCloudinary() {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  })
  return cloudinary
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin()

    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const title = (formData.get('title') as string) || ''
    const category = (formData.get('category') as string) || ''

    if (!file) {
      return NextResponse.json({ error: '请选择文件' }, { status: 400 })
    }

    // 转成 base64 给 Cloudinary
    const bytes = await file.arrayBuffer()
    const base64 = Buffer.from(bytes).toString('base64')
    const dataUri = `data:${file.type};base64,${base64}`

    const cld = getCloudinary()
    const result = await cld.uploader.upload(dataUri, {
      folder: 'arc-portfolio/gallery',
      resource_type: 'image',
    })

    const image = await createGalleryImage({
      url: result.secure_url,
      public_id: result.public_id,
      title,
      category,
    })

    return NextResponse.json({ success: true, image })
  } catch (err) {
    console.error('[gallery/upload]', err)
    return NextResponse.json({ error: '上传失败' }, { status: 500 })
  }
}
