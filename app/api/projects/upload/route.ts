// app/api/projects/upload/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/auth'
import { uploadLarge } from '@/lib/uploadLarge'

// POST /api/projects/upload 上传项目封面图（仅上传到 Cloudinary，不写库）
export async function POST(req: NextRequest) {
  const session = await requireAdminApi()
  if (!session) return NextResponse.json({ error: '无权限' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: '请选择文件' }, { status: 400 })

  const buffer = Buffer.from(await file.arrayBuffer())
  const result = await uploadLarge(buffer, {
    folder: 'arc-portfolio/projects',
    resource_type: 'image',
  })

  return NextResponse.json({
    ok: true,
    url: result.secure_url,
    public_id: result.public_id,
  })
}
