// lib/cloudinary-loader.ts
// next/images.loaderFile 自定义加载器：
// - Cloudinary URL：注入 f_auto(自动 AVIF/WebP) + q_auto + 按设备宽度裁剪，替代全尺寸原图
// - 本地 Logo：复用 Next 图片端点；其他来源保留原 URL

interface LoaderParams {
  src: string
  width: number
  quality?: number
}

const CLD_RE = /^(https:\/\/res\.cloudinary\.com\/[^/]+\/(?:image|video|raw)\/upload\/)(.+)$/
// 已带显式变换参数的 URL（如后台拼好的裁剪），不再二次注入
const HAS_TRANSFORM = /^(c_|w_|h_|q_|f_|e_|ar_|g_|dpr_)/

export default function cloudinaryLoader({ src, width, quality }: LoaderParams): string {
  if (src === '/logo.png') return `/_next/image?url=%2Flogo.png&w=${width}&q=75`
  const m = src.match(CLD_RE)
  if (!m || HAS_TRANSFORM.test(m[2])) return src

  const params = [`w_${width}`, 'f_auto', `q_${quality || 'auto'}`]
  return `${m[1]}${params.join(',')}/${m[2]}`
}
