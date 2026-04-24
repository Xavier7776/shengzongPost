// app/api/user/upload/route.ts
// POST /api/user/upload  → 登录用户上传图片到 Cloudinary（供编辑请求使用）

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { v2 as cloudinary } from 'cloudinary'

function getCld() {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key:    process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  })
  return cloudinary
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: '请先登录' }, { status: 401 })

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ error: '请选择文件' }, { status: 400 })
    if (file.size > 10 * 1024 * 1024)
      return NextResponse.json({ error: '图片不能超过 10MB' }, { status: 400 })

    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowed.includes(file.type))
      return NextResponse.json({ error: '仅支持 JPG/PNG/WebP/GIF' }, { status: 400 })

    const bytes   = await file.arrayBuffer()
    const base64  = Buffer.from(bytes).toString('base64')
    const dataUri = `data:${file.type};base64,${base64}`

    const result = await getCld().uploader.upload(dataUri, {
      folder:        'arc-portfolio/user-uploads',
      resource_type: 'image',
    })

    return NextResponse.json({ ok: true, url: result.secure_url })
  } catch (err) {
    console.error('[user/upload]', err)
    return NextResponse.json({ error: '上传失败' }, { status: 500 })
  }
}
