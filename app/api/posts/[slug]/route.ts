// app/api/posts/[slug]/route.ts
// PATCH /api/posts/:slug → 更新文章
// DELETE /api/posts/:slug → 删除文章
import { NextRequest, NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { updatePost, deletePost } from '@/lib/db'
import { requireAdminApi } from '@/lib/auth'

interface Ctx { params: { slug: string } }

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const session = await requireAdminApi()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const post = await updatePost(params.slug, body)

    revalidateTag('posts')
    revalidateTag(`post-${params.slug}`)
    // 如果 slug 本身被修改，也刷新新 slug 的缓存
    if (body.slug && body.slug !== params.slug) {
      revalidateTag(`post-${body.slug}`)
    }

    // 若本次操作将文章设为发布状态，异步触发 AI 评论（fire-and-forget）
    if (body.published === true) {
      const effectiveSlug = body.slug ?? params.slug
      const baseUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000'
      fetch(`${baseUrl}/api/ai/comment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.AI_COMMENT_SECRET ?? 'ai-comment-internal'}`,
        },
        body: JSON.stringify({ slug: effectiveSlug }),
      }).catch(err => console.error('[posts/slug] AI 评论触发失败:', err))
    }

    return NextResponse.json(post)
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const session = await requireAdminApi()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    await deletePost(params.slug)
    revalidateTag('posts')
    revalidateTag(`post-${params.slug}`)
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}
