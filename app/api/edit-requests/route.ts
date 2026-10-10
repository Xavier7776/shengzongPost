import { logFailure } from '@/lib/security/log'
import { allowAuthAttempt } from '@/lib/auth-rate-limit'
import { withWriteGuard } from '@/lib/security/write-guard'
// app/api/edit-requests/route.ts
// GET  /api/edit-requests              → 当前用户的提交记录
// POST /api/edit-requests              → 普通用户提交编辑请求

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { createEditRequest, getEditRequestsByUser } from '@/lib/db'
import { safePostImageUrl } from '@/lib/html/sanitize-post'

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
    logFailure('app/api/edit-requests', err)
    return NextResponse.json({ error: '查询失败' }, { status: 500 })
  }
}

async function handlePOST(req: NextRequest) {
  const session = await getSession()
  if (!session?.user) return NextResponse.json({ error: '请先登录' }, { status: 401 })
  const userId = Number((session.user as { id?: string }).id)
  if (!userId) return NextResponse.json({ error: '用户信息异常' }, { status: 400 })

  if (!await allowAuthAttempt(req, 'submission', String((session.user as { id?: string }).id))) return NextResponse.json({ error: '操作太频繁，请稍后重试' }, { status: 429 })

  try {
    const { post_slug, title, excerpt, content, tags, cover_image, from_id } = await req.json()
    if (typeof post_slug !== 'string' || !post_slug || typeof title !== 'string' || !title.trim() || typeof content !== 'string' || !content.trim())
      return NextResponse.json({ error: 'slug、标题和正文不能为空' }, { status: 400 })
    if ((excerpt != null && typeof excerpt !== 'string') ||
      (tags != null && (!Array.isArray(tags) || tags.some((tag:unknown)=>typeof tag !== 'string'))) ||
      (cover_image != null && (typeof cover_image !== 'string' || (cover_image && !safePostImageUrl(cover_image)))) ||
      (from_id != null && (!Number.isSafeInteger(from_id) || from_id<=0)))
      return NextResponse.json({error:'提交字段格式无效'},{status:400})

    const request = await createEditRequest({
      post_slug,
      user_id: userId,
      title: title.trim(),
      excerpt: excerpt?.trim() ?? '',
      content: content.trim(),
      tags: Array.isArray(tags) ? tags : [],
      cover_image: cover_image ?? null,
      from_id,
    })
    return NextResponse.json({ ok: true, request }, { status: 201 })
  } catch (err) {
    if(err instanceof Error && err.message==='Cannot resubmit')return NextResponse.json({error:'文章不属于本人，或原申请不存在/尚未拒绝，请刷新后重试'},{status:409})
    logFailure('app/api/edit-requests', err)
    return NextResponse.json({ error: '提交失败' }, { status: 500 })
  }
}

export const POST = withWriteGuard(handlePOST)
