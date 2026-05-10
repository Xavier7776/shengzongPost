// app/api/posts/attachment/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/auth'
import { createPostAttachment, getPostAttachmentsBySlug, deletePostAttachment } from '@/lib/db'

// ── GET /api/posts/attachment?slug=xxx  →  读取附件列表 ───────────────────────
export async function GET(req: NextRequest) {
  const session = await requireAdminApi()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const slug = req.nextUrl.searchParams.get('slug')
  if (!slug) return NextResponse.json({ error: '缺少 slug 参数' }, { status: 400 })

  try {
    const attachments = await getPostAttachmentsBySlug(slug)
    return NextResponse.json(attachments)
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}

// ── POST /api/posts/attachment  →  添加附件（仅写数据库，不上传 Cloudinary）─────
// Body: JSON { post_slug?, filename, size, external_url }
export async function POST(req: NextRequest) {
  const session = await requireAdminApi()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: {
    post_slug?: string | null
    filename?: string
    size?: number
    external_url?: string
  }

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: '请求体格式错误' }, { status: 400 })
  }

  const { post_slug, filename, size, external_url } = body

  if (!filename || !filename.trim())
    return NextResponse.json({ error: '请提供文件名' }, { status: 400 })
  if (!external_url || !external_url.trim())
    return NextResponse.json({ error: '请提供蓝奏云链接' }, { status: 400 })
  if (!/^https?:\/\//i.test(external_url))
    return NextResponse.json({ error: '蓝奏云链接格式不正确，请以 http(s):// 开头' }, { status: 400 })

  try {
    const attachment = await createPostAttachment({
      post_slug:    post_slug ?? null,
      url:          external_url,
      public_id:    null,
      external_url: external_url,
      filename:     filename.trim(),
      size:         size ?? 0,
      mime_type:    'application/pdf',
      uploaded_by:  Number((session as any).user?.id ?? 0),
    })

    return NextResponse.json({
      id:           attachment.id,
      url:          attachment.url,
      external_url: attachment.external_url,
      filename:     attachment.filename,
      size:         attachment.size,
    })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: '保存附件失败' }, { status: 500 })
  }
}

// ── DELETE /api/posts/attachment?id=xxx  →  删除附件（仅删数据库）────────────
export async function DELETE(req: NextRequest) {
  const session = await requireAdminApi()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const id = Number(req.nextUrl.searchParams.get('id'))
  if (!id) return NextResponse.json({ error: '缺少 id 参数' }, { status: 400 })

  try {
    const deleted = await deletePostAttachment(id)
    if (!deleted) return NextResponse.json({ error: '附件不存在' }, { status: 404 })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: '删除失败' }, { status: 500 })
  }
}