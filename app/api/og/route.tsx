// app/api/og/route.tsx
// OG 分享卡生成接口：/api/og?kind=home|gallery
// 用普通 route handler 而非文件约定 opengraph-image：
// Windows 下 @vercel/og 在构建期渲染有 fileURLToPath 兼容 bug；
// force-dynamic 的 API 路由只在请求时执行，绕开构建期渲染
import { NextRequest } from 'next/server'
import { ImageResponse } from 'next/og'
import { getAllGalleryImages } from '@/lib/db'

export const dynamic = 'force-dynamic'

const SIZE = { width: 1200, height: 630 }

const BASE_STYLE = {
  width: '100%',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  fontFamily: 'sans-serif',
} as const

export async function GET(req: NextRequest) {
  const kind = req.nextUrl.searchParams.get('kind') ?? 'home'

  if (kind === 'gallery') {
    let count = 0
    try {
      count = (await getAllGalleryImages()).length
    } catch { /* 数据库不可用时降级 */ }

    return new ImageResponse(
      (
        <div
          style={{
            ...BASE_STYLE,
            justifyContent: 'space-between',
            padding: '80px',
            backgroundColor: '#0a0a0a',
            backgroundImage:
              'radial-gradient(circle at 20% 30%, rgba(200,169,126,0.16) 0%, transparent 50%), radial-gradient(circle at 85% 75%, rgba(59,130,246,0.12) 0%, transparent 50%)',
          }}
        >
          <div style={{ display: 'flex', fontSize: 32, fontWeight: 700, color: '#c8a97e', letterSpacing: 6 }}>
            MindStack · Gallery
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: 96, fontWeight: 800, color: '#ffffff', letterSpacing: -2 }}>视觉存档</span>
            <span style={{ marginTop: 24, fontSize: 34, color: '#9ca3af' }}>
              {count > 0 ? `${count} 件摄影与视觉作品` : '极简主义摄影与视觉创作'}
            </span>
          </div>
          <div style={{ display: 'flex', fontSize: 26, color: '#6b7280' }}>瀑布流浏览 · 点击放大</div>
        </div>
      ),
      SIZE
    )
  }

  // 默认：首页品牌卡
  return new ImageResponse(
    (
      <div
        style={{
          ...BASE_STYLE,
          justifyContent: 'center',
          padding: '80px',
          backgroundColor: '#0a0a0a',
          backgroundImage:
            'radial-gradient(circle at 25% 20%, rgba(59,130,246,0.18) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(99,102,241,0.15) 0%, transparent 50%)',
        }}
      >
        <div style={{ display: 'flex', fontSize: 36, fontWeight: 700, color: '#60a5fa', letterSpacing: 4 }}>
          MindStack
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            marginTop: 32,
            fontSize: 88,
            fontWeight: 800,
            lineHeight: 1.1,
            letterSpacing: -2,
            color: '#ffffff',
          }}
        >
          <span>以严谨的美学标准</span>
          <span>构建数字化体验</span>
        </div>
        <div style={{ display: 'flex', marginTop: 40, fontSize: 30, color: '#9ca3af' }}>
          博客 · 作品 · 视觉存档 · AI Skills
        </div>
      </div>
    ),
    SIZE
  )
}
