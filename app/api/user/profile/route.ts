// app/api/user/profile/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { sql, getUserById, getUserEquippedFrame, getPoints } from '@/lib/db'

export const dynamic = 'force-dynamic'

// GET /api/user/profile        → 当前登录用户
// GET /api/user/profile?id=xxx → 指定用户公开信息
export async function GET(req: NextRequest) {
  const idParam = req.nextUrl.searchParams.get('id')

  try {
    if (idParam) {
      // 公开资料，不需要登录
      const user = await getUserById(Number(idParam))
      if (!user) return NextResponse.json({ error: '用户不存在' }, { status: 404 })
      const equippedFrame = await getUserEquippedFrame(user.id)
      return NextResponse.json({
        id: user.id, name: user.name, avatar: user.avatar, bio: user.bio,
        title: user.title, motto: user.motto, location: user.location,
        website: user.website, github_url: user.github_url, twitter_url: user.twitter_url,
        tech_stack: user.tech_stack, created_at: user.created_at,
        equipped_frame_css_key: equippedFrame?.css_key ?? null,
      })
    }

    // 自己的完整资料
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: '未登录' }, { status: 401 })
    const userId = Number((session.user as { id?: string }).id)
    if (!userId) return NextResponse.json({ error: '用户信息异常' }, { status: 400 })

    const rows = await sql`SELECT id, email, name, phone, bio, avatar,
      location, website, github_url, twitter_url, motto, tech_stack, title, equipped_frame
      FROM users WHERE id=${userId} LIMIT 1`
    if (!rows[0]) return NextResponse.json({ error: '用户不存在' }, { status: 404 })
    const equippedFrame = await getUserEquippedFrame(userId)
    const points = await getPoints(userId)
    const row = rows[0] as Record<string, unknown>
    return NextResponse.json({
      ...row,
      points,
      equipped_frame_css_key: equippedFrame?.css_key ?? null,
    }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (err) {
    console.error('[profile GET]', err)
    return NextResponse.json({ error: '读取失败' }, { status: 500 })
  }
}

// PATCH /api/user/profile
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: '未登录' }, { status: 401 })
  const userId = Number((session.user as { id?: string }).id)
  if (!userId) return NextResponse.json({ error: '用户信息异常' }, { status: 400 })

  try {
    const { name, phone, bio, avatar, location, website, github_url, twitter_url, motto, tech_stack, title } = await req.json()
    if (!name?.trim()) return NextResponse.json({ error: '昵称不能为空' }, { status: 400 })
    if (name.trim().length > 30) return NextResponse.json({ error: '昵称不能超过 30 字' }, { status: 400 })
    if (phone && phone.length > 20) return NextResponse.json({ error: '手机号格式有误' }, { status: 400 })
    if (bio && bio.length > 200) return NextResponse.json({ error: '简介不能超过 200 字' }, { status: 400 })
    if (location && location.length > 100) return NextResponse.json({ error: '所在地不能超过 100 字' }, { status: 400 })
    if (motto && motto.length > 100) return NextResponse.json({ error: '签名不能超过 100 字' }, { status: 400 })
    if (title && title.length > 100) return NextResponse.json({ error: '职位不能超过 100 字' }, { status: 400 })
    if (Array.isArray(tech_stack) && tech_stack.length > 30) return NextResponse.json({ error: '技术栈最多 30 项' }, { status: 400 })

    await sql`UPDATE users SET
      name=${name.trim()}, phone=${phone?.trim()??null}, bio=${bio?.trim()??null}, avatar=${avatar??null},
      location=${location?.trim()??null}, website=${website?.trim()??null},
      github_url=${github_url?.trim()??null}, twitter_url=${twitter_url?.trim()??null},
      motto=${motto?.trim()??null}, tech_stack=${Array.isArray(tech_stack)?tech_stack:[]},
      title=${title?.trim()??null}
      WHERE id=${userId}`
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[profile PATCH]', err)
    return NextResponse.json({ error: '保存失败，请重试' }, { status: 500 })
  }
}
