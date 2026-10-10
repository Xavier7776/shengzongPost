import { logFailure } from '@/lib/security/log'
import { withWriteGuard } from '@/lib/security/write-guard'
// app/api/admin/shop/cursors/upload/route.ts
// POST /api/admin/shop/cursors/upload  FormData: { file, key }
// 把 GIF 存到持久对象存储，返回可访问 URL
import { NextRequest, NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/auth'
import { uploadLarge } from '@/lib/uploadLarge'
import { randomUUID } from 'node:crypto'

export const dynamic = 'force-dynamic'

const MAX_SIZE = 8 * 1024 * 1024 // 8MB

async function handlePOST(req: NextRequest) {
  try {
    if (!await requireAdminApi()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const rawKey = formData.get('key')
    const key = typeof rawKey === 'string' ? rawKey.trim().toLowerCase() : ''

    if (!file || typeof file.arrayBuffer !== 'function')  return NextResponse.json({ error: '请选择文件' }, { status: 400 })
    if (!key)   return NextResponse.json({ error: '请输入 key' }, { status: 400 })
    if (!/^[a-z0-9-]{1,100}$/.test(key)) {
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

    const buffer = Buffer.from(await file.arrayBuffer())
    if (!['GIF87a','GIF89a'].includes(buffer.subarray(0,6).toString('ascii'))) return NextResponse.json({error:'文件不是 GIF 图片'},{status:400})
    const filename = `${key}.${ext}`
    const result = await uploadLarge(buffer,{folder:'arc-portfolio/cursor-effects',public_id:`${key}_${randomUUID()}`,overwrite:false,resource_type:'image'})
    return NextResponse.json({ success: true, url:result.secure_url, filename })
  } catch (err) {
    logFailure('app/api/admin/shop/cursors/upload', err)
    return NextResponse.json({ error: '上传失败' }, { status: 500 })
  }
}

export const POST = withWriteGuard(handlePOST, { maxBytes: 11 * 1024 * 1024 })
