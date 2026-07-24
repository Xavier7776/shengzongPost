// app/api/projects/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/auth'
import { getEnabledProjects, getAllProjectsAdmin, createProject } from '@/lib/db'
import { revalidatePath } from 'next/cache'

// GET /api/projects         公开：只返回 enabled 项目
// GET /api/projects?admin=1 管理端：返回全部项目
export async function GET(req: NextRequest) {
  const isAdmin = req.nextUrl.searchParams.get('admin') === '1'
  if (isAdmin) {
    const session = await requireAdminApi()
    if (!session) return NextResponse.json({ error: '无权限' }, { status: 401 })
    return NextResponse.json(await getAllProjectsAdmin())
  }
  return NextResponse.json(await getEnabledProjects())
}

// POST /api/projects 新建项目
export async function POST(req: NextRequest) {
  const session = await requireAdminApi()
  if (!session) return NextResponse.json({ error: '无权限' }, { status: 401 })

  const body = await req.json()
  if (!body.slug?.trim() || !body.name?.trim()) {
    return NextResponse.json({ error: 'slug 和名称不能为空' }, { status: 400 })
  }

  try {
    const project = await createProject({
      slug: body.slug.trim(),
      name: body.name.trim(),
      tagline: body.tagline?.trim() || null,
      description: body.description?.trim() || null,
      content: body.content?.trim() || null,
      cover_image: body.cover_image?.trim() || null,
      cover_public_id: body.cover_public_id?.trim() || null,
      tech_stack: Array.isArray(body.tech_stack) ? body.tech_stack : [],
      highlights: Array.isArray(body.highlights) ? body.highlights : [],
      demo_url: body.demo_url?.trim() || null,
      github_url: body.github_url?.trim() || null,
      year: body.year?.trim() || null,
      sort_order: Number(body.sort_order) || 0,
      enabled: body.enabled !== false,
      attachments: Array.isArray(body.attachments) ? body.attachments : [],
    })
    // neon 直连不走 Next fetch cache，revalidateTag 无效；用 revalidatePath 刷新 /work 页
    revalidatePath('/work')
    return NextResponse.json({ ok: true, project })
  } catch (e) {
    const msg = e instanceof Error ? e.message : '创建失败'
    // slug 唯一约束冲突
    if (msg.includes('unique') || msg.includes('duplicate')) {
      return NextResponse.json({ error: 'slug 已存在，请更换' }, { status: 409 })
    }
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
