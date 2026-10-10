import { logFailure } from '@/lib/security/log'
import { allowAuthAttempt } from '@/lib/auth-rate-limit'
import { isRasterImage } from '@/lib/security/image'
import { withWriteGuard } from '@/lib/security/write-guard'
// app/api/user/avatar/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { sql } from '@/lib/db'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { uploadLarge } from '@/lib/uploadLarge'

async function handlePOST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: '未登录' }, { status: 401 })

  const userId = Number((session.user as { id?: string }).id)
  if (!userId) return NextResponse.json({ error: '用户信息异常' }, { status: 400 })

  if (!await allowAuthAttempt(req, 'upload', String((session.user as { id?: string }).id))) return NextResponse.json({ error: '操作太频繁，请稍后重试' }, { status: 429 })

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    if (!file || typeof file.arrayBuffer !== 'function') return NextResponse.json({ error: '未找到文件' }, { status: 400 })
    if (file.size > 5 * 1024 * 1024)
      return NextResponse.json({ error: '图片不能超过 5MB' }, { status: 400 })

    const allowed = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowed.includes(file.type))
      return NextResponse.json({ error: '只支持 JPG/PNG/WebP' }, { status: 400 })

    const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg'
    const fileName = `user_${userId}.${ext}`
    const avatarsDir = join(process.cwd(), 'public', 'avatars')
    const localUrl = `/avatars/${fileName}`

    const buffer = Buffer.from(await file.arrayBuffer())
    if (!isRasterImage(buffer)) return NextResponse.json({ error: '文件不是支持的 JPG/PNG/WebP/GIF 图片' }, { status: 400 })

    await mkdir(avatarsDir, { recursive: true })

    // 1. 始终保存本地
    await writeFile(join(avatarsDir, fileName), buffer)

    // 2. 尝试上传 Cloudinary
    let avatarUrl = localUrl
    try {
      const result = await uploadLarge(buffer, {
        folder: 'avatars',
        public_id: `user_${userId}`,
        overwrite: true,
        resource_type: 'image',
        transformation: [{ width: 200, height: 200, crop: 'fill', gravity: 'face' }],
      })
      avatarUrl = result.secure_url

    } catch (cldErr) {
      logFailure('app/api/user/avatar', cldErr)
    }

    // 加版本号防止浏览器缓存旧头像，同时写入 DB 确保重新登录后也拿到最新 URL
    const cacheBustUrl = `${avatarUrl}${avatarUrl.includes('?') ? '&' : '?'}v=${Date.now()}`
    await sql`UPDATE users SET avatar=${cacheBustUrl} WHERE id=${userId}`
    return NextResponse.json({ url: cacheBustUrl, localUrl })
  } catch (err) {
    logFailure('app/api/user/avatar', err)
    return NextResponse.json({ error: '上传失败，请重试' }, { status: 500 })
  }
}

export const POST = withWriteGuard(handlePOST, { maxBytes: 11 * 1024 * 1024 })
