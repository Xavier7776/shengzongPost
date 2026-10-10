import { cloudinary } from '@/lib/cloudinary'
import { allowedCloudinaryUrl } from '@/lib/security/remote-assets'

export interface UploadResult {
  secure_url: string
  public_id: string
  width?: number
  height?: number
}

/** Current callers cap files at 16 MiB; stream once without ephemeral disk or ambiguous retries. */
export function uploadLarge(
  buffer: Buffer,
  options: Record<string, unknown> & { resource_type?: 'raw' | 'image' | 'video' | 'auto' }
): Promise<UploadResult> {
  return new Promise((resolve, reject) => {
    let settled = false
    const finish = (error: unknown, result?: UploadResult) => {
      if (settled) return
      settled = true
      if (error) { reject(error); return }
      if (!result || typeof result.secure_url !== 'string' || !allowedCloudinaryUrl(result.secure_url) ||
          typeof result.public_id !== 'string' || !result.public_id.trim()) {
        reject(new Error('Upload provider returned an invalid result')); return
      }
      resolve({secure_url:result.secure_url,public_id:result.public_id,width:result.width,height:result.height})
    }
    try {
      const stream = cloudinary.uploader.upload_stream({timeout:60_000,...options}, finish)
      stream.on('error', error => finish(error))
      stream.end(buffer)
    } catch (error) { finish(error) }
  })
}
