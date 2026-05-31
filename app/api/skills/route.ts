// app/api/skills/route.ts
// GET /api/skills - 获取技能列表（支持分页、筛选、排序）
import { NextRequest, NextResponse } from 'next/server'
import { getSkills, getSkillCategories } from '@/lib/db-skills'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const pageSize = Math.min(50, Math.max(1, parseInt(searchParams.get('pageSize') || '12', 10)))
    const category = searchParams.get('category') || undefined
    const source_type = searchParams.get('source_type') || undefined
    const sort = (searchParams.get('sort') || 'updated_at') as 'stars' | 'updated_at' | 'created_at'
    const order = (searchParams.get('order') || 'desc') as 'asc' | 'desc'
    const search = searchParams.get('search') || undefined

    const includeCategories = searchParams.get('includeCategories') === '1'

    const result = await getSkills({ page, pageSize, category, source_type, sort, order, search })

    const response: Record<string, unknown> = {
      skills: result.skills,
      total: result.total,
      page,
      pageSize,
      totalPages: Math.ceil(result.total / pageSize),
    }

    if (includeCategories) {
      response.categories = await getSkillCategories()
    }

    return NextResponse.json(response)
  } catch (err) {
    console.error('[skills GET]', err)
    return NextResponse.json({ error: '读取失败' }, { status: 500 })
  }
}
