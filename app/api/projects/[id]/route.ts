import { safeLink } from '@/shared/markdown/sanitize'
import { logFailure } from '@/lib/security/log'
import { withWriteGuard } from '@/lib/security/write-guard'
// app/api/projects/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/auth'
import { updateProject, deleteProject } from '@/lib/db'
import { invalidatePublishedContent } from '@/lib/content-cache'
import { cloudinary } from '@/lib/cloudinary'

// PATCH /api/projects/[id] 更新项目（支持部分字段更新）
async function handlePATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await requireAdminApi()
  if (!session) return NextResponse.json({ error: '无权限' }, { status: 401 })

  const id = Number(params.id)
  if (isNaN(id)) return NextResponse.json({ error: '参数错误' }, { status: 400 })

  const body = await req.json()
  for (const value of [body.demo_url, body.github_url]) if (value !== undefined && value !== null && (typeof value !== 'string' || (value.trim() && !safeLink(value)))) return NextResponse.json({ error: '项目链接地址无效' }, { status: 400 })

  try {
    // 处理数组字段：空值传 null 以触发 COALESCE 保留原值，数组传数组
    const data: Record<string, unknown> = {}
    if (body.slug !== undefined) data.slug = body.slug?.trim() || null
    if (body.name !== undefined) data.name = body.name?.trim() || null
    if (body.tagline !== undefined) data.tagline = body.tagline?.trim() || null
    if (body.description !== undefined) data.description = body.description?.trim() || null
    if (body.content !== undefined) data.content = body.content?.trim() || null
    if (body.cover_image !== undefined) data.cover_image = body.cover_image?.trim() || null
    if (body.cover_public_id !== undefined) data.cover_public_id = body.cover_public_id?.trim() || null
    if (body.tech_stack !== undefined) data.tech_stack = Array.isArray(body.tech_stack) ? body.tech_stack : []
    if (body.highlights !== undefined) data.highlights = Array.isArray(body.highlights) ? body.highlights : []
    if (body.demo_url !== undefined) data.demo_url = body.demo_url?.trim() || null
    if (body.github_url !== undefined) data.github_url = body.github_url?.trim() || null
    if (body.year !== undefined) data.year = body.year?.trim() || null
    if (body.sort_order !== undefined) data.sort_order = Number(body.sort_order) || 0
    if (body.enabled !== undefined) data.enabled = !!body.enabled
    if (body.attachments !== undefined) data.attachments = Array.isArray(body.attachments) ? body.attachments : []

    const project = await updateProject(id, data)
    const cacheStatus = invalidatePublishedContent([])
    return NextResponse.json({ ok: true, project }, { headers: { 'X-Content-Cache-Status': cacheStatus } })
  } catch (e) {
    const msg = e instanceof Error ? e.message : '更新失败'
    if (msg.includes('unique') || msg.includes('duplicate')) {
      return NextResponse.json({ error: 'slug 已存在，请更换' }, { status: 409 })
    }
    return NextResponse.json({ error: '操作失败，请稍后再试' }, { status: 500 })
  }
}

// DELETE /api/projects/[id] 删除项目，同时清理 Cloudinary 封面图
async function handleDELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await requireAdminApi()
  if (!session) return NextResponse.json({ error: '无权限' }, { status: 401 })

  const id = Number(params.id)
  if (isNaN(id)) return NextResponse.json({ error: '参数错误' }, { status: 400 })

  const publicId = await deleteProject(id)

  // 清理 Cloudinary 封面图（失败不影响删除结果）
  if (publicId) {
    try {
      await cloudinary.uploader.destroy(publicId, { resource_type: 'image' })
    } catch (e) {
      logFailure('app/api/projects/[id]', e)
    }
  }

  const cacheStatus = invalidatePublishedContent([])
  return NextResponse.json({ ok: true }, { headers: { 'X-Content-Cache-Status': cacheStatus } })
}

export const PATCH = withWriteGuard(handlePATCH)
export const DELETE = withWriteGuard(handleDELETE)
