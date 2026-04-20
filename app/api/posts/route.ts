// app/api/posts/route.ts
// POST /api/posts  → 新建文章
import { NextRequest, NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { createPost } from '@/lib/db'
import { requireAdminApi } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const session = await requireAdminApi()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { slug, title, excerpt, content, tags, published } = body

    if (!slug || !title || !content) {
      return NextResponse.json({ error: 'slug、title、content 为必填项' }, { status: 400 })
    }

    const post = await createPost({ slug, title, excerpt, content, tags: tags ?? [], published: published ?? false })

    // 发布后立刻刷新相关缓存
    revalidateTag('posts')
    revalidateTag(`post-${slug}`)

    return NextResponse.json(post, { status: 201 })
  } catch (e: any) {
    // slug 唯一约束冲突
    if (e?.message?.includes('unique')) {
      return NextResponse.json({ error: '该 slug 已存在' }, { status: 409 })
    }
    console.error(e)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}
