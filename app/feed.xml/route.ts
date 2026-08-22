// app/feed.xml/route.ts
// RSS 2.0 订阅源，供 RSS 阅读器抓取博客文章
import { getAllPosts } from '@/lib/db'
import { getSiteUrl } from '@/lib/site-url'

// 1 小时缓存：RSS 阅读器轮询频率低，没必要每次请求都查库
export const revalidate = 3600

function escapeXml(s: string): string {
  return s.replace(/[<>&'"]/g, c => ({
    '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;',
  }[c] as string))
}

export async function GET() {
  const base = getSiteUrl()
  const posts = await getAllPosts()

  const items = posts.map(p => `
    <item>
      <title>${escapeXml(p.title)}</title>
      <link>${base}/blog/${p.slug}</link>
      <guid isPermaLink="true">${base}/blog/${p.slug}</guid>
      <description>${escapeXml(p.excerpt || '')}</description>
      <pubDate>${new Date(p.created_at).toUTCString()}</pubDate>
    </item>`).join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>MindStack</title>
    <link>${base}</link>
    <description>以严谨的美学标准构建数字化体验 — 思考、技术与创作</description>
    <language>zh-CN</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${base}/feed.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`

  return new Response(xml, {
    headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
  })
}
