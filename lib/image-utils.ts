// lib/image-utils.ts
// 为 next/image 生成 blur placeholder 的工具函数

/**
 * 为 Cloudinary 图片生成极低质量的模糊占位图 URL，用作 next/image 的 blurDataURL。
 * 非 Cloudinary 图片返回 undefined（next/image 将使用默认空占位）。
 *
 * Cloudinary 支持在 /upload/ 后追加变换参数：
 *   e_blur:1000  极致高斯模糊
 *   q_1          最低质量
 *   w_10         宽度 10px
 * 组合后得到一张仅数百字节的模糊缩略图，适合做加载前的占位，不影响原图质量。
 */
export function getBlurDataURL(
  url: string | null | undefined
): string | undefined {
  if (!url) return undefined
  // 仅处理 Cloudinary 图片 URL
  if (!url.includes('res.cloudinary.com')) return undefined
  // 在第一个 /upload/ 后插入低质量模糊变换参数（JS replace 默认只替换首个匹配）
  return url.replace('/upload/', '/upload/e_blur:1000,q_1,w_10/')
}
