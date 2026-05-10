// app/api/user/avatar/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { uploadLarge } from '@/lib/uploadLarge'
import { sql } from '@/lib/db'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: '未登录' }, { status: 401 })

  const userId = Number((session.user as { id?: string }).id)
  if (!userId) return NextResponse.json({ error: '用户信息异常' }, { status: 400 })

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ error: '未找到文件' }, { status: 400 })
    if (file.size > 5 * 1024 * 1024)
      return NextResponse.json({ error: '图片不能超过 5MB' }, { status: 400 })

    const allowed = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowed.includes(file.type))
      return NextResponse.json({ error: '只支持 JPG/PNG/WebP' }, { status: 400 })

    const buffer = Buffer.from(await file.arrayBuffer())

    const result = await uploadLarge(buffer, {
      folder:          'avatars',
      public_id:       `user_${userId}`,
      overwrite:       true,
      resource_type:   'image',
      transformation:  [{ width: 200, height: 200, crop: 'fill', gravity: 'face' }],
    })

    await sql`UPDATE users SET avatar=${result.secure_url} WHERE id=${userId}`

    return NextResponse.json({ url: result.secure_url })
  } catch (err) {
    console.error('[avatar upload]', err)
    return NextResponse.json({ error: '上传失败，请重试' }, { status: 500 })
  }
}
