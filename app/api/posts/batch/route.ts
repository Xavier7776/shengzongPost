// app/api/posts/batch/route.ts
// Privileged bulk mutation only: a logged-in non-admin must not publish or delete articles.
import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { requireAdminApi } from '@/lib/auth'
import { sql } from '@/lib/db'

const MAX_BATCH = 50
const validActions = new Set(['publish', 'unpublish', 'delete'])

export async function POST(req: NextRequest) {
  const admin = await requireAdminApi()
  if (!admin) return NextResponse.json({ error: '无管理员权限' }, { status: 403 })

  let payload: unknown
  try { payload = await req.json() } catch {
    return NextResponse.json({ error: '无效的 JSON' }, { status: 400 })
  }
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return NextResponse.json({ error: '参数错误' }, { status: 400 })
  }
  const { action, slugs } = payload as { action?: unknown; slugs?: unknown }
  if (typeof action !== 'string' || !validActions.has(action) ||
      !Array.isArray(slugs) || slugs.length === 0 || slugs.length > MAX_BATCH ||
      slugs.some(s => typeof s !== 'string' || !s.trim() || s.length > 160)) {
    return NextResponse.json({ error: 'action 或 slugs 无效，单次最多 50 篇' }, { status: 400 })
  }
  const uniqueSlugs = Array.from(new Set(slugs as string[]))

  try {
    let rows: Record<string, unknown>[]
    if (action === 'publish') {
      rows = await sql`UPDATE posts SET published=true, updated_at=NOW()
        WHERE slug = ANY(${uniqueSlugs}) RETURNING slug`
    } else if (action === 'unpublish') {
      rows = await sql`UPDATE posts SET published=false, updated_at=NOW()
        WHERE slug = ANY(${uniqueSlugs}) RETURNING slug`
    } else {
      rows = await sql`DELETE FROM posts WHERE slug = ANY(${uniqueSlugs}) RETURNING slug`
    }
    if (rows.length) {
      revalidatePath('/blog')
      revalidatePath('/learn')
      for (const row of rows) revalidatePath('/blog/' + String(row.slug))
    }
    // Report actual affected rows, not the number of user-supplied slugs.
    return NextResponse.json({ ok: true, count: rows.length })
  } catch (e) {
    console.error('[posts batch]', e)
    return NextResponse.json({ error: '批量操作失败' }, { status: 500 })
  }
}
