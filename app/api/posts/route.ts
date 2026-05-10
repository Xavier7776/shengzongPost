import { NextRequest, NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { createPost, getAdminUserId } from '@/lib/db'
import { requireAdminApi } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const session = await requireAdminApi()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const { slug, title, excerpt, content, tags, published, cover_image, attachments, author_id } = body

    if (!slug || !title || !content)
      return NextResponse.json({ error: 'slug、title、content 为必填项' }, { status: 400 })

    const resolvedAuthorId = author_id ?? await getAdminUserId()

    const post = await createPost({
      slug, title, excerpt, content,
      tags: tags ?? [],
      published: published ?? false,
      cover_image: cover_image ?? null,
      attachments: attachments ?? [],
      author_id: resolvedAuthorId,
    })

    // 发布后立刻刷新相关缓存
    revalidateTag('posts')
    revalidateTag(`post-${slug}`)

    // 若文章直接发布，异步触发 AI 评论（fire-and-forget，不阻塞响应）
    if (published) {
      const baseUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000'
      fetch(`${baseUrl}/api/ai/comment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.AI_COMMENT_SECRET ?? 'ai-comment-internal'}`,
        },
        body: JSON.stringify({ slug }),
      }).catch(err => console.error('[posts] AI 评论触发失败:', err))
    }

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
