// app/work/[slug]/opengraph-image.tsx
// 项目详情 OG 卡片：项目名 + 一句话简介 + 技术栈
import { ImageResponse } from 'next/og'
import { getProjectBySlug } from '@/lib/db-works'

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

interface OgImageProps {
  params: { slug: string }
}

export default async function OgImage({ params }: OgImageProps) {
  const project = await getProjectBySlug(params.slug)

  const name = project?.name ?? 'MindStack Work'
  const tagline = project?.tagline ?? '数字化作品集'
  const tech: string[] = (project?.techStack ?? []).slice(0, 5)

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
        }}
      >
        <div style={{ display: 'flex', fontSize: 28, fontWeight: 700, color: '#60a5fa', letterSpacing: 3 }}>
          MindStack · Work
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: 88, fontWeight: 800, color: '#ffffff', letterSpacing: -2 }}>
            {name.length > 24 ? name.slice(0, 24) + '…' : name}
          </span>
          <span style={{ marginTop: 26, fontSize: 34, color: '#9ca3af' }}>
            {tagline.length > 70 ? tagline.slice(0, 70) + '…' : tagline}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 16 }}>
          {tech.map(t => (
            <span
              key={t}
              style={{
                display: 'flex',
                padding: '8px 22px',
                fontSize: 24,
                fontWeight: 600,
                color: '#93c5fd',
                backgroundColor: 'rgba(59,130,246,0.12)',
                border: '1px solid rgba(59,130,246,0.3)',
                borderRadius: 999,
              }}
            >
              {t}
            </span>
          ))}
        </div>
      </div>
    ),
    { ...size }
  )
}
