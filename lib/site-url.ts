// lib/site-url.ts
// 站点根 URL 唯一解析入口。
// 优先级：显式配置 > Vercel 生产域名 > 本地开发
// 此前 sitemap/robots/feed/comments/posts/email 各写一套、口径不一，
// 在 Vercel 上漏配某个变量时会输出 localhost，导致 SEO 和邮件链接事故。

export function getSiteUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXTAUTH_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : '') ||
    'http://localhost:3000'
  return raw.replace(/\/$/, '')
}
