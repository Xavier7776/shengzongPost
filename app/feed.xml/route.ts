// app/feed.xml/route.ts
// RSS 2.0 订阅源，供 RSS 阅读器抓取博客文章
import { getAllPosts } from '@/lib/db'
import { getSiteUrl } from '@/lib/site-url'
import { unstable_cache } from 'next/cache'

// Direct database publishers cannot invalidate this process; retain a bounded TTL.
export const dynamic = 'force-dynamic'
export const revalidate = 0

function escapeXml(s: string): string {
  return s.replace(/[<>&'"]/g, c => ({
    '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;',
  }[c] as string))
}

const feedXml = unstable_cache(async () => {
  const base = getSiteUrl()
  const posts = await getAllPosts()
  const lastBuildDate=posts.length?new Date(Math.max(...posts.map(p=>Date.parse(p.updated_at||p.created_at)))).toUTCString():null

  const items = posts.map(p => `
    <item>
      <title>${escapeXml(p.title)}</title>
      <link>${escapeXml(base+'/blog/'+encodeURIComponent(p.slug))}</link>
      <guid isPermaLink="true">${escapeXml(base+'/blog/'+encodeURIComponent(p.slug))}</guid>
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
    ${lastBuildDate?'<lastBuildDate>'+lastBuildDate+'</lastBuildDate>':''}
    <atom:link href="${base}/feed.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`

  return xml
}, ['published-rss-v2'], {revalidate:300,tags:['published-content']})

export async function GET() {
  return new Response(await feedXml(), {
    headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
  })
}
