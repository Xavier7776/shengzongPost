// app/api/skills/[slug]/route.ts
// GET /api/skills/[slug] - 获取单个技能详情
import { NextRequest, NextResponse } from 'next/server'
import { getSkillBySlug } from '@/lib/db-skills'

export const dynamic = 'force-dynamic'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const skill = await getSkillBySlug(slug)

    if (!skill) {
      return NextResponse.json({ error: '技能不存在' }, { status: 404 })
    }

    return NextResponse.json(skill)
  } catch (err) {
    console.error('[skills/[slug] GET]', err)
    return NextResponse.json({ error: '读取失败' }, { status: 500 })
  }
}
