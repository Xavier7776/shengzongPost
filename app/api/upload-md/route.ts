// app/api/upload-md/route.ts
// POST /api/upload-md → 通用 md 文件上传（博文 + work 项目复用）
// 流程：multipart/form-data → uploadLarge(resource_type='raw', public_id 带后缀) → 返回 { url, filename, size }
//
// 鉴权：管理员（博文编辑器）/ 管理员（work 后台编辑器）都用同一个接口
// 调用方负责把返回的 { url, filename, size } 写入对应表的 attachments JSONB
//
// 用法：
//   const fd = new FormData()
//   fd.append('file', mdFile)
//   const res = await fetch('/api/upload-md', { method: 'POST', body: fd })
//   const { url, filename, size } = await res.json()
//   // 然后调用方把 { url, filename, size } 追加到 post.attachments 或 project.attachments
import { NextRequest, NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/auth'
import { uploadLarge } from '@/lib/uploadLarge'
import { randomUUID } from 'crypto'

const MAX_MD_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_MIME = [
  'text/markdown',
  'text/plain',
  'application/octet-stream', // 部分系统对 .md 文件返回此类型
]

export async function POST(req: NextRequest) {
  const session = await requireAdminApi()
  if (!session) return NextResponse.json({ error: '无权限，请先登录管理员账号' }, { status: 401 })

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) return NextResponse.json({ error: '请选择 md 文件' }, { status: 400 })
    if (file.size > MAX_MD_SIZE) return NextResponse.json({ error: '文件不能超过 10MB' }, { status: 400 })

    // 放宽 MIME 校验：部分系统对 .md 返回 application/octet-stream
    const isMdByName = /\.md$/i.test(file.name)
    if (!ALLOWED_MIME.includes(file.type) && !isMdByName) {
      return NextResponse.json({ error: '仅支持 Markdown（.md）文件' }, { status: 400 })
    }

    // 生成带 .md 后缀的 public_id，确保下载 URL 带后缀（浏览器才能识别文件类型）
    // Cloudinary public_id 仅允许字母数字 / 连字符 / 下划线，故对原始文件名做净化
    const sanitized = file.name
      .replace(/\.md$/i, '')
      .replace(/[^a-zA-Z0-9-_]/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 40) || 'file'
    const publicId = `arc-portfolio/md-attachments/${sanitized}-${randomUUID()}.md`

    const buffer = Buffer.from(await file.arrayBuffer())
    const result = await uploadLarge(buffer, {
      folder:        'arc-portfolio/md-attachments',
      public_id:     publicId,
      resource_type: 'raw',
    })

    return NextResponse.json({
      url:      result.secure_url,
      filename: file.name,
      size:     file.size,
    })
  } catch (err) {
    console.error('[upload-md POST] 异常:', err)
    return NextResponse.json({ error: '上传失败，请重试' }, { status: 500 })
  }
}
