// app/api/comments/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { getApprovedComments, createComment } from '@/lib/db'

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get('slug')
  if (!slug) return NextResponse.json({ error: '缺少 slug' }, { status: 400 })
  try {
    return NextResponse.json(await getApprovedComments(slug))
  } catch (err) {
    console.error('[comments GET]', err)
    return NextResponse.json({ error: '读取失败' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: '请先登录' }, { status: 401 })

  try {
    const { post_slug, content, parent_id } = await req.json()
    if (!post_slug || !content?.trim())
      return NextResponse.json({ error: '内容不能为空' }, { status: 400 })
    if (content.trim().length > 1000)
      return NextResponse.json({ error: '评论不能超过 1000 字' }, { status: 400 })

    const userId = Number((session.user as { id?: string }).id)
    if (!userId) return NextResponse.json({ error: '用户信息异常' }, { status: 400 })

    await createComment({
      post_slug, content: content.trim(),
      user_id: userId,
      user_name: session.user.name ?? '匿名用户',
      parent_id: parent_id ? Number(parent_id) : null,
    })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[comments POST]', err)
    return NextResponse.json({ error: '提交失败，请重试' }, { status: 500 })
  }
}
