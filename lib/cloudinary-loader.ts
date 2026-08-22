// lib/cloudinary-loader.ts
// next/images.loaderFile 自定义加载器：
// - Cloudinary URL：注入 f_auto(自动 AVIF/WebP) + q_auto + 按设备宽度裁剪，替代全尺寸原图
// - 其他来源：原样返回，走默认行为

interface LoaderParams {
  src: string
  width: number
  quality?: number
}

const CLD_RE = /^(https:\/\/res\.cloudinary\.com\/[^/]+\/(?:image|video|raw)\/upload\/)(.+)$/
// 已带显式变换参数的 URL（如后台拼好的裁剪），不再二次注入
const HAS_TRANSFORM = /^(c_|w_|h_|q_|f_|e_|ar_|g_|dpr_)/

export default function cloudinaryLoader({ src, width, quality }: LoaderParams): string {
  const m = src.match(CLD_RE)
  if (!m || HAS_TRANSFORM.test(m[2])) return src

  const params = [`w_${width}`, 'f_auto', `q_${quality || 'auto'}`]
  return `${m[1]}${params.join(',')}/${m[2]}`
}
