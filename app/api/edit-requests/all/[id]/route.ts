import { logFailure } from '@/lib/security/log'
import { withWriteGuard } from '@/lib/security/write-guard'
// app/api/edit-requests/[id]/route.ts
// PATCH /api/edit-requests/[id]  → 管理员审核（approve / reject）

import { NextRequest, NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/auth'
import {
  getEditRequestById,
  reviewEditRequest,
} from '@/lib/db'
import { invalidatePublishedContent } from '@/lib/content-cache'
import { EditionEditConflict } from '@/lib/learn/edit-conflict'

async function handlePATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await requireAdminApi()
  if (!session) return NextResponse.json({ error: '无权限' }, { status: 401 })

  const id = Number(params.id)
  if (!Number.isSafeInteger(id) || id<=0) return NextResponse.json({ error: '参数错误' }, { status: 400 })

  try {
    const { status, admin_note } = await req.json()
    if (status !== 'approved' && status !== 'rejected')
      return NextResponse.json({ error: 'status 必须为 approved 或 rejected' }, { status: 400 })
    if (admin_note != null && typeof admin_note !== 'string') return NextResponse.json({error:'审核备注必须为文字'},{status:400})
    const { request, post } = await reviewEditRequest(id, status, admin_note)
    const cacheStatus = post?.published ? invalidatePublishedContent([post.slug]) : 'unchanged'
    return NextResponse.json({ ok: true, request }, {headers:{'X-Content-Cache-Status':cacheStatus}})
  } catch (err) {
    if(err instanceof EditionEditConflict)return NextResponse.json({error:err.message},{status:409})
    if(err instanceof Error && err.message==='Request already reviewed')return NextResponse.json({error:'该请求已审核或内容已变更'},{status:409})
    if(err instanceof Error && err.message==='Request target unavailable')return NextResponse.json({error:'文章已撤回或不属于申请人，请拒绝该申请'},{status:409})
    if(err instanceof Error && ['Request not found','Post not found'].includes(err.message))return NextResponse.json({error:'请求或文章不存在'},{status:404})
    if((err as {code?:string})?.code==='23505')return NextResponse.json({error:'目标 Slug 已存在，请重新提交'},{status:409})
    logFailure('app/api/edit-requests/all/[id]', err)
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
  if (!Number.isSafeInteger(id) || id<=0) return NextResponse.json({ error: '参数错误' }, { status: 400 })

  try {
    const req = await getEditRequestById(id)
    if (!req) return NextResponse.json({ error: '不存在' }, { status: 404 })
    return NextResponse.json(req)
  } catch (err) {
    logFailure('app/api/edit-requests/all/[id]', err)
    return NextResponse.json({ error: '查询失败' }, { status: 500 })
  }
}

export const PATCH = withWriteGuard(handlePATCH)
