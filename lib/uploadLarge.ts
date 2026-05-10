// lib/uploadLarge.ts
// 所有上传接口统一走这里，底层用 cloudinary.uploader.upload_large（分片上传）
// upload_large 接受文件路径，所以先把 buffer 写临时文件，上传完立即删除

import { v2 as cloudinary } from 'cloudinary'
import { writeFile, unlink } from 'fs/promises'
import { tmpdir } from 'os'
import { join } from 'path'
import { randomUUID } from 'crypto'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export interface UploadResult {
  secure_url: string
  public_id:  string
}

export async function uploadLarge(
  buffer: Buffer,
  options: Record<string, unknown> & { resource_type?: 'raw' | 'image' | 'video' | 'auto' }
): Promise<UploadResult> {
  const tmpPath = join(tmpdir(), randomUUID())
  await writeFile(tmpPath, buffer)
  try {
    // upload_large 不返回 Promise，必须手动用 callback 包装
    const result = await new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
      cloudinary.uploader.upload_large(
        tmpPath,
        { chunk_size: 6 * 1024 * 1024, ...options },
        (error: unknown, result: { secure_url: string; public_id: string } | undefined) => {
          if (error || !result) return reject(error ?? new Error('upload_large 返回空结果'))
          resolve({ secure_url: result.secure_url, public_id: result.public_id })
        }
      )
    })
    return result
  } finally {
    await unlink(tmpPath).catch(() => {})
  }
}
