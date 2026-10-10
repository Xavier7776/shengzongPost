import { logFailure } from '@/lib/security/log'
import { withWriteGuard } from '@/lib/security/write-guard'
import { NextRequest, NextResponse } from 'next/server'
import { invalidatePublishedContent } from '@/lib/content-cache'
import { createPost, getAdminUserId } from '@/lib/db'
import { requireAdminApi } from '@/lib/auth'

async function handlePOST(req: NextRequest) {
  const session = await requireAdminApi()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const { slug, title, excerpt, content, tags, published, cover_image, attachments, author_id } = body

    if (typeof slug !== 'string' || !slug.trim() || slug.length > 160 || typeof title !== 'string' || !title.trim() || title.length > 300 || typeof content !== 'string' || !content.trim() || (excerpt !== undefined && typeof excerpt !== 'string') || (tags !== undefined && (!Array.isArray(tags) || tags.length > 30 || tags.some((t: unknown) => typeof t !== 'string' || t.length > 100))))
      return NextResponse.json({ error: 'slug、title、content 为必填项' }, { status: 400 })

    const resolvedAuthorId = author_id ?? await getAdminUserId()

    const post = await createPost({
      slug, title, excerpt, content,
      tags: tags ?? [],
      published: published ?? false,
      cover_image: cover_image ?? null,
      attachments: attachments ?? [],
      author_id: resolvedAuthorId,
    })

    const cacheStatus=post.published?invalidatePublishedContent([post.slug]):'unchanged'
    return NextResponse.json(post, { status: 201,headers:{'X-Content-Cache-Status':cacheStatus} })
  } catch (e: any) {
    // slug 唯一约束冲突
    if (e?.message?.includes('unique')) {
      return NextResponse.json({ error: '该 slug 已存在' }, { status: 409 })
    }
    logFailure('app/api/posts')
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}

export const POST = withWriteGuard(handlePOST)
