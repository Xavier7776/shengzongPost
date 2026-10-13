import { logFailure } from '@/lib/security/log'
import { withWriteGuard } from '@/lib/security/write-guard'
// app/api/posts/[slug]/route.ts
// GET    /api/posts/:slug → 读取单篇文章（已登录用户，供 dashboard 编辑用）
// PATCH  /api/posts/:slug → 更新文章（管理员）
// DELETE /api/posts/:slug → 删除文章（管理员）
import { NextRequest, NextResponse } from 'next/server'
import { invalidatePublishedContent } from '@/lib/content-cache'
import { updatePost, deletePost, getPostBySlugAdmin, getPostBySlug, getUserRoleById } from '@/lib/db'
import { requireAdminApi } from '@/lib/auth'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { EditionEditConflict } from '@/lib/learn/edit-conflict'

interface Ctx { params: Promise<{ slug: string }> }

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { slug } = await params
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
    const post = isAdmin ? await getPostBySlugAdmin(slug) : await getPostBySlug(slug)
    if (!post || (!isAdmin && post.author_id !== userId)) {
      return NextResponse.json({ error: '文章不存在' }, { status: 404 })
    }
    return NextResponse.json(post, { headers: { 'Cache-Control': 'private, no-store' } })
  } catch (e) {
    logFailure('app/api/posts/[slug]', e)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}

async function handlePATCH(req: NextRequest, { params }: Ctx) {
  const { slug } = await params
  const session = await requireAdminApi()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const post = await updatePost(slug, {
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

    const cacheStatus=invalidatePublishedContent([slug,post.slug])
    return NextResponse.json(post,{headers:{'X-Content-Cache-Status':cacheStatus}})
  } catch (e) {
    if(e instanceof EditionEditConflict)return NextResponse.json({error:e.message},{status:409})
    logFailure('app/api/posts/[slug]')
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}

async function handleDELETE(_req: NextRequest, { params }: Ctx) {
  const { slug } = await params
  const session = await requireAdminApi()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    await deletePost(slug)

    const cacheStatus=invalidatePublishedContent([slug])
    return NextResponse.json({ ok: true },{headers:{'X-Content-Cache-Status':cacheStatus}})
  } catch (e) {
    logFailure('app/api/posts/[slug]')
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}

export const PATCH = withWriteGuard(handlePATCH)
export const DELETE = withWriteGuard(handleDELETE)
