// app/api/slides/upload/route.ts
// POST /api/slides/upload  → 上传图片到 Cloudinary，返回 secure_url
// 与 gallery/upload 逻辑相同，但存放到 arc-portfolio/slides 文件夹

import { NextRequest, NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/auth'
import { v2 as cloudinary } from 'cloudinary'

function getCloudinary() {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key:    process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  })
  return cloudinary
}

export async function POST(req: NextRequest) {
  const session = await requireAdminApi()
  if (!session) return NextResponse.json({ error: '无权限' }, { status: 401 })

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ error: '请选择文件' }, { status: 400 })

    const bytes  = await file.arrayBuffer()
    const base64 = Buffer.from(bytes).toString('base64')
    const dataUri = `data:${file.type};base64,${base64}`

    const cld    = getCloudinary()
    const result = await cld.uploader.upload(dataUri, {
      folder:        'arc-portfolio/slides',
      resource_type: 'image',
    })

    return NextResponse.json({ ok: true, url: result.secure_url })
  } catch (err) {
    console.error('[slides/upload]', err)
    return NextResponse.json({ error: '上传失败' }, { status: 500 })
  }
}
