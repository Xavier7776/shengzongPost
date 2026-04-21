// app/api/user/profile/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { sql } from '@/lib/db'

// GET /api/user/profile — 返回当前用户完整信息
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: '未登录' }, { status: 401 })

  const userId = Number((session.user as { id?: string }).id)
  if (!userId) return NextResponse.json({ error: '用户信息异常' }, { status: 400 })

  try {
    const rows = await sql`
      SELECT id, email, name, phone, bio, avatar FROM users WHERE id = ${userId} LIMIT 1
    `
    if (!rows[0]) return NextResponse.json({ error: '用户不存在' }, { status: 404 })
    return NextResponse.json(rows[0])
  } catch (err) {
    console.error('[profile GET]', err)
    return NextResponse.json({ error: '读取失败' }, { status: 500 })
  }
}

// PATCH /api/user/profile — 更新昵称、手机、简介、头像
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: '未登录' }, { status: 401 })

  const userId = Number((session.user as { id?: string }).id)
  if (!userId) return NextResponse.json({ error: '用户信息异常' }, { status: 400 })

  try {
    const { name, phone, bio, avatar } = await req.json()

    if (!name?.trim()) return NextResponse.json({ error: '昵称不能为空' }, { status: 400 })
    if (name.trim().length > 30) return NextResponse.json({ error: '昵称不能超过 30 字' }, { status: 400 })
    if (phone && phone.length > 20) return NextResponse.json({ error: '手机号格式有误' }, { status: 400 })
    if (bio && bio.length > 200) return NextResponse.json({ error: '简介不能超过 200 字' }, { status: 400 })

    await sql`
      UPDATE users SET
        name   = ${name.trim()},
        phone  = ${phone?.trim() ?? null},
        bio    = ${bio?.trim() ?? null},
        avatar = ${avatar ?? null}
      WHERE id = ${userId}
    `
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[profile PATCH]', err)
    return NextResponse.json({ error: '保存失败，请重试' }, { status: 500 })
  }
}
