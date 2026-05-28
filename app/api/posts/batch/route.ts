// app/api/posts/batch/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { sql } from '@/lib/db'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: '请先登录' }, { status: 401 })

  try {
    const { action, slugs } = await req.json()
    if (!Array.isArray(slugs) || slugs.length === 0)
      return NextResponse.json({ error: '缺少 slugs' }, { status: 400 })

    let count = 0
    if (action === 'publish') {
      await sql`UPDATE posts SET published=true, updated_at=NOW() WHERE slug = ANY(${slugs})`
      count = slugs.length
    } else if (action === 'unpublish') {
      await sql`UPDATE posts SET published=false, updated_at=NOW() WHERE slug = ANY(${slugs})`
      count = slugs.length
    } else if (action === 'delete') {
      await sql`DELETE FROM posts WHERE slug = ANY(${slugs})`
      count = slugs.length
    } else {
      return NextResponse.json({ error: '无效操作' }, { status: 400 })
    }

    return NextResponse.json({ ok: true, count })
  } catch (err) {
    console.error('[posts batch]', err)
    return NextResponse.json({ error: '操作失败' }, { status: 500 })
  }
}
