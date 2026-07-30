// app/blog/[slug]/opengraph-image.tsx
// 博客文章动态 OG 图片：根据文章标题、作者、日期生成分享卡片
// Next.js 14.2 内置 next/og，无需额外安装
// 文件约定式路由：放在 [slug] 目录下，Next.js 自动识别为该路由的 opengraph-image
import { ImageResponse } from 'next/og'
import { getPostBySlug } from '@/lib/db'

// 图片尺寸：1200x630（社交平台通用 OG 卡片尺寸）
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

// Next.js 14.2 中 params 为同步对象（与该路由 page.tsx 保持一致）
interface OgImageProps {
  params: { slug: string }
}

export default async function OgImage({ params }: OgImageProps) {
  const post = await getPostBySlug(params.slug)

  // 文章不存在时返回占位卡片，避免抛错导致 OG 图片 500
  const title = post?.title ?? 'MindStack'
  const excerpt = post?.excerpt ?? '以严谨的美学标准构建数字化体验'
  const author = post?.author_name ?? 'ARC'
  // 日期格式化：仅取 YYYY-MM-DD，避免 Invalid Date
  const dateStr = post?.created_at
    ? new Date(post.created_at).toISOString().slice(0, 10)
    : ''

  // 内联样式：next/og 只支持内联样式，不能使用外部 CSS 或 Tailwind 类
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '80px',
          backgroundColor: '#0a0a0a',
          backgroundImage:
            'radial-gradient(circle at 25% 20%, rgba(59,130,246,0.18) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(99,102,241,0.15) 0%, transparent 50%)',
          fontFamily: 'sans-serif',
          color: '#ffffff',
        }}
      >
        {/* 顶部：网站名 + 日期 */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: 28,
            fontWeight: 700,
          }}
        >
          <span style={{ color: '#60a5fa', letterSpacing: 2 }}>MindStack</span>
          {dateStr && (
            <span style={{ color: '#9ca3af', fontWeight: 500 }}>{dateStr}</span>
          )}
        </div>

        {/* 中部：文章标题 */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            fontSize: 72,
            fontWeight: 800,
            lineHeight: 1.15,
            letterSpacing: -1,
            maxWidth: 1040,
          }}
        >
          {/* 标题过长时通过截断避免溢出：next/og 不支持 line-clamp，按字符截断 */}
          <span>{title.length > 60 ? title.slice(0, 60) + '…' : title}</span>
          {/* 副标题：摘要 */}
          {excerpt && (
            <span
              style={{
                marginTop: 28,
                fontSize: 32,
                fontWeight: 500,
                lineHeight: 1.4,
                color: '#9ca3af',
                letterSpacing: 0,
              }}
            >
              {excerpt.length > 80 ? excerpt.slice(0, 80) + '…' : excerpt}
            </span>
          )}
        </div>

        {/* 底部：作者信息 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            fontSize: 30,
            fontWeight: 600,
            color: '#e5e7eb',
          }}
        >
          <span style={{ color: '#60a5fa' }}>by {author}</span>
          <span style={{ marginLeft: 20, color: '#4b5563' }}>|</span>
          <span style={{ marginLeft: 20, color: '#9ca3af' }}>arc-portfolio</span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
