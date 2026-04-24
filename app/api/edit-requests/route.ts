// app/api/edit-requests/route.ts
// GET  /api/edit-requests              → 当前用户的提交记录
// POST /api/edit-requests              → 普通用户提交编辑请求

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { createEditRequest, deleteEditRequest, getEditRequestsByUser } from '@/lib/db'

export const dynamic = 'force-dynamic'

async function getSession(req?: NextRequest) {
  return getServerSession(authOptions)
}

export async function GET() {
  const session = await getSession()
  if (!session?.user) return NextResponse.json({ error: '请先登录' }, { status: 401 })
  const userId = Number((session.user as { id?: string }).id)
  if (!userId) return NextResponse.json({ error: '用户信息异常' }, { status: 400 })

  try {
    const requests = await getEditRequestsByUser(userId)
    return NextResponse.json(requests)
  } catch (err) {
    console.error('[edit-requests GET]', err)
    return NextResponse.json({ error: '查询失败' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session?.user) return NextResponse.json({ error: '请先登录' }, { status: 401 })
  const userId = Number((session.user as { id?: string }).id)
  if (!userId) return NextResponse.json({ error: '用户信息异常' }, { status: 400 })

  try {
    const { post_slug, title, excerpt, content, tags, cover_image, from_id } = await req.json()
    if (!post_slug || !title?.trim() || !content?.trim())
      return NextResponse.json({ error: 'slug、标题和正文不能为空' }, { status: 400 })

    // 如果是重新提交被拒绝的申请，先删除原记录
    if (from_id) {
      await deleteEditRequest(Number(from_id), userId)
    }

    const request = await createEditRequest({
      post_slug,
      user_id: userId,
      title: title.trim(),
      excerpt: excerpt?.trim() ?? '',
      content: content.trim(),
      tags: Array.isArray(tags) ? tags : [],
      cover_image: cover_image ?? null,
    })
    return NextResponse.json({ ok: true, request }, { status: 201 })
  } catch (err) {
    console.error('[edit-requests POST]', err)
    return NextResponse.json({ error: '提交失败' }, { status: 500 })
  }
}
