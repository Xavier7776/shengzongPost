// app/api/posts/image/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/auth'
import { createPostImage, getPostImages, deletePostImage } from '@/lib/db'
import { v2 as cloudinary } from 'cloudinary'

function getCld() {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key:    process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  })
  return cloudinary
}

export async function GET(req: NextRequest) {
  const session = await requireAdminApi()
  if (!session) return NextResponse.json({ error: '无权限' }, { status: 401 })
  const slug = req.nextUrl.searchParams.get('slug') ?? undefined
  try {
    const images = await getPostImages(slug)
    return NextResponse.json(images)
  } catch (err) {
    console.error('[posts/image GET]', err)
    return NextResponse.json({ error: '查询失败' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  // ── 诊断日志，确认请求到达此 handler ──
  console.log('[posts/image POST] ✅ handler 被调用')

  const session = await requireAdminApi()
  console.log('[posts/image POST] session:', session ? '已登录' : '未登录/null')

  if (!session) {
    console.error('[posts/image POST] ❌ 鉴权失败，返回 401')
    return NextResponse.json({ error: '无权限，请重新登录后再试' }, { status: 401 })
  }

  try {
    const formData = await req.formData()
    const file     = formData.get('file')     as File   | null
    const postSlug = formData.get('postSlug') as string | null

    console.log('[posts/image POST] 文件名:', file?.name, '大小:', file?.size, 'postSlug:', postSlug)

    if (!file) return NextResponse.json({ error: '请选择文件' }, { status: 400 })
    if (file.size > 10 * 1024 * 1024)
      return NextResponse.json({ error: '图片不能超过 10MB' }, { status: 400 })

    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowed.includes(file.type))
      return NextResponse.json({ error: '仅支持 JPG/PNG/WebP/GIF' }, { status: 400 })

    const bytes   = await file.arrayBuffer()
    const base64  = Buffer.from(bytes).toString('base64')
    const dataUri = `data:${file.type};base64,${base64}`

    console.log('[posts/image POST] 开始上传到 Cloudinary folder: arc-portfolio/post-images')
    const result = await getCld().uploader.upload(dataUri, {
      folder:        'arc-portfolio/post-images',
      resource_type: 'image',
    })
    console.log('[posts/image POST] Cloudinary 上传成功, public_id:', result.public_id)

    const userId = Number((session.user as { id?: string }).id ?? 0)
    console.log('[posts/image POST] 写入 post_images 表, userId:', userId)

    const image = await createPostImage({
      post_slug:   postSlug || null,
      url:         result.secure_url,
      public_id:   result.public_id,
      filename:    file.name,
      size:        file.size,
      mime_type:   file.type,
      uploaded_by: userId,
    })
    console.log('[posts/image POST] ✅ 写入成功, image.id:', image.id)

    return NextResponse.json({ url: image.url, id: image.id, public_id: image.public_id })
  } catch (err) {
    console.error('[posts/image POST] ❌ 异常:', err)
    return NextResponse.json({ error: '上传失败，请重试' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const session = await requireAdminApi()
  if (!session) return NextResponse.json({ error: '无权限' }, { status: 401 })

  const id = Number(req.nextUrl.searchParams.get('id'))
  if (!id) return NextResponse.json({ error: '缺少 id' }, { status: 400 })

  try {
    const deleted = await deletePostImage(id)
    if (!deleted) return NextResponse.json({ error: '记录不存在' }, { status: 404 })
    await getCld().uploader.destroy(deleted.public_id).catch(e =>
      console.warn('[posts/image DELETE] Cloudinary 删除失败:', e)
    )
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[posts/image DELETE]', err)
    return NextResponse.json({ error: '删除失败' }, { status: 500 })
  }
}
