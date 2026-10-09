// app/api/posts/[slug]/route.ts
// GET    /api/posts/:slug → 读取单篇文章（已登录用户，供 dashboard 编辑用）
// PATCH  /api/posts/:slug → 更新文章（管理员）
// DELETE /api/posts/:slug → 删除文章（管理员）
import { NextRequest, NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { updatePost, deletePost, getPostBySlugAdmin, getPostBySlug, getUserRoleById } from '@/lib/db'
import { requireAdminApi } from '@/lib/auth'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'

interface Ctx { params: { slug: string } }

export async function GET(_req: NextRequest, { params }: Ctx) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: '请先登录' }, { status: 401 })

  const user = session.user as { id?: string | number; role?: string }
  const userId = Number(user.id)
  if (!Number.isSafeInteger(userId) || userId <= 0) {
    return NextResponse.json({ error: '无效的用户身份' }, { status: 401 })
  }

  try {
    // Administrator-only drafts must never be exposed to arbitrary authenticated users.
    // Check the live DB role; a JWT may still carry an old elevated role after revocation.
    const role = await getUserRoleById(userId)
    const isAdmin = user.role === 'admin' && role === 'admin'
    const post = isAdmin ? await getPostBySlugAdmin(params.slug) : await getPostBySlug(params.slug)
    if (!post || (!isAdmin && post.author_id !== userId)) {
      return NextResponse.json({ error: '文章不存在' }, { status: 404 })
    }
    return NextResponse.json(post, { headers: { 'Cache-Control': 'private, no-store' } })
  } catch (e) {
    console.error('[posts GET]', e)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const session = await requireAdminApi()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const post = await updatePost(params.slug, {
      title:       body.title,
      excerpt:     body.excerpt,
      content:     body.content,
      tags:        body.tags,
      published:   body.published,
      slug:        body.slug,
      cover_image:  body.cover_image,
      attachments:  body.attachments,
      author_id:    body.author_id ?? undefined,
    })

    revalidateTag('posts')
    revalidateTag(`post-${params.slug}`)
    // 如果 slug 本身被修改，也刷新新 slug 的缓存
    if (body.slug && body.slug !== params.slug) {
      revalidateTag(`post-${body.slug}`)
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