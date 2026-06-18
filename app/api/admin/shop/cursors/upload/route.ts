// app/api/admin/shop/cursors/upload/route.ts
// POST /api/admin/shop/cursors/upload  FormData: { file, key }
// 把 GIF 写入 public/cursor-effects/<key>.gif，返回可访问 URL
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'

export const dynamic = 'force-dynamic'

const PUBLIC_DIR = join(process.cwd(), 'public', 'cursor-effects')
const MAX_SIZE = 8 * 1024 * 1024 // 8MB

export async function POST(req: NextRequest) {
  try {
    await requireAdmin()

    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const key  = (formData.get('key') as string | null)?.trim().toLowerCase()

    if (!file)  return NextResponse.json({ error: '请选择文件' }, { status: 400 })
    if (!key)   return NextResponse.json({ error: '请输入 key' }, { status: 400 })
    if (!/^[a-z0-9-]+$/.test(key)) {
      return NextResponse.json({ error: 'key 只能包含小写字母、数字、连字符' }, { status: 400 })
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: `文件超过 ${MAX_SIZE / 1024 / 1024}MB 限制` }, { status: 400 })
    }

    // 仅允许 gif（管理端上传 GIF 用）；sprite-sheet 仍走 codex-pets 离线下载
    const ext = file.name.toLowerCase().endsWith('.gif') ? 'gif'
              : file.type === 'image/gif' ? 'gif'
              : ''
    if (!ext) {
      return NextResponse.json({ error: '仅支持 .gif 文件' }, { status: 400 })
    }

    await mkdir(PUBLIC_DIR, { recursive: true })
    const filename = `${key}.${ext}`
    const filepath = join(PUBLIC_DIR, filename)
    const buffer = Buffer.from(await file.arrayBuffer())
    await writeFile(filepath, buffer)

    const url = `/cursor-effects/${filename}`
    return NextResponse.json({ success: true, url, filename })
  } catch (err) {
    console.error('[admin shop cursors upload]', err)
    return NextResponse.json({ error: '上传失败' }, { status: 500 })
  }
}
