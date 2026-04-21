// app/api/user/avatar/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { v2 as cloudinary } from 'cloudinary'
import { sql } from '@/lib/db'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: '未登录' }, { status: 401 })

  const userId = Number((session.user as { id?: string }).id)
  if (!userId) return NextResponse.json({ error: '用户信息异常' }, { status: 400 })

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ error: '未找到文件' }, { status: 400 })
    if (file.size > 5 * 1024 * 1024) return NextResponse.json({ error: '图片不能超过 5MB' }, { status: 400 })

    const allowed = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowed.includes(file.type)) return NextResponse.json({ error: '只支持 JPG/PNG/WebP' }, { status: 400 })

    const buffer = Buffer.from(await file.arrayBuffer())
    const base64 = `data:${file.type};base64,${buffer.toString('base64')}`

    const result = await cloudinary.uploader.upload(base64, {
      folder: 'avatars',
      public_id: `user_${userId}`,
      overwrite: true,
      transformation: [{ width: 200, height: 200, crop: 'fill', gravity: 'face' }],
    })

    const url = result.secure_url

    // ✅ 修复：上传成功后立即同步写入数据库，避免头像 URL 与 DB 不一致
    await sql`UPDATE users SET avatar=${url} WHERE id=${userId}`

    return NextResponse.json({ url })
  } catch (err) {
    console.error('[avatar upload]', err)
    return NextResponse.json({ error: '上传失败，请重试' }, { status: 500 })
  }
}
