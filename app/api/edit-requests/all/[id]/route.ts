// app/api/edit-requests/[id]/route.ts
// PATCH /api/edit-requests/[id]  → 管理员审核（approve / reject）

import { NextRequest, NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/auth'
import {
  getEditRequestById,
  reviewEditRequest,
  updatePost,
  createPost,
} from '@/lib/db'
import { revalidateTag } from 'next/cache'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await requireAdminApi()
  if (!session) return NextResponse.json({ error: '无权限' }, { status: 401 })

  const id = Number(params.id)
  if (isNaN(id)) return NextResponse.json({ error: '参数错误' }, { status: 400 })

  try {
    const { status, admin_note } = await req.json()
    if (status !== 'approved' && status !== 'rejected')
      return NextResponse.json({ error: 'status 必须为 approved 或 rejected' }, { status: 400 })

    const editReq = await getEditRequestById(id)
    if (!editReq) return NextResponse.json({ error: '请求不存在' }, { status: 404 })
    if (editReq.status !== 'pending')
      return NextResponse.json({ error: '该请求已审核' }, { status: 409 })

    if (status === 'approved') {
      const isNew = editReq.post_slug.startsWith('__new__:')

      if (isNew) {
        // post_slug 格式：__new__:desired-slug
        const desiredSlug = editReq.post_slug.slice('__new__:'.length) || 'untitled'
        await createPost({
          slug:        desiredSlug,
          title:       editReq.title,
          excerpt:     editReq.excerpt,
          content:     editReq.content,
          tags:        editReq.tags,
          published:   false,   // 管理员审核通过后创建草稿，再决定是否发布
          cover_image: editReq.cover_image,
        })
        revalidateTag('posts')
      } else {
        await updatePost(editReq.post_slug, {
          title:       editReq.title,
          excerpt:     editReq.excerpt,
          content:     editReq.content,
          tags:        editReq.tags,
          cover_image: editReq.cover_image ?? undefined,
        })
        revalidateTag('posts')
        revalidateTag(`post-${editReq.post_slug}`)
      }
    }

    const updated = await reviewEditRequest(id, status, admin_note)
    return NextResponse.json({ ok: true, request: updated })
  } catch (err) {
    console.error('[edit-requests PATCH]', err)
    return NextResponse.json({ error: '操作失败' }, { status: 500 })
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await requireAdminApi()
  if (!session) return NextResponse.json({ error: '无权限' }, { status: 401 })

  const id = Number(params.id)
  if (isNaN(id)) return NextResponse.json({ error: '参数错误' }, { status: 400 })

  try {
    const req = await getEditRequestById(id)
    if (!req) return NextResponse.json({ error: '不存在' }, { status: 404 })
    return NextResponse.json(req)
  } catch (err) {
    console.error('[edit-requests GET id]', err)
    return NextResponse.json({ error: '查询失败' }, { status: 500 })
  }
}
