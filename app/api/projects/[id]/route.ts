// app/api/projects/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/auth'
import { updateProject, deleteProject } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { v2 as cloudinary } from 'cloudinary'

// Cloudinary 实例（按需初始化）
function getCloudinary() {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  })
  return cloudinary
}

// PATCH /api/projects/[id] 更新项目（支持部分字段更新）
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await requireAdminApi()
  if (!session) return NextResponse.json({ error: '无权限' }, { status: 401 })

  const id = Number(params.id)
  if (isNaN(id)) return NextResponse.json({ error: '参数错误' }, { status: 400 })

  const body = await req.json()

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
    revalidatePath('/work')
    return NextResponse.json({ ok: true, project })
  } catch (e) {
    const msg = e instanceof Error ? e.message : '更新失败'
    if (msg.includes('unique') || msg.includes('duplicate')) {
      return NextResponse.json({ error: 'slug 已存在，请更换' }, { status: 409 })
    }
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

// DELETE /api/projects/[id] 删除项目，同时清理 Cloudinary 封面图
export async function DELETE(
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
      await getCloudinary().uploader.destroy(publicId, { resource_type: 'image' })
    } catch (e) {
      console.error('[projects] 清理 Cloudinary 失败:', e)
    }
  }

  revalidatePath('/work')
  return NextResponse.json({ ok: true })
}
