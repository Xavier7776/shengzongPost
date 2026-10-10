import type { Metadata, Viewport } from 'next'
import { DM_Sans, DM_Mono } from 'next/font/google'
import './globals.css'
import CursorGlow from '@/components/ui/CursorGlow'
import CursorFollower from '@/components/ui/CursorFollower'
import SiteShell from '@/components/layout/SiteShell'
import AnalyticsTracker from '@/components/AnalyticsTracker'
import Providers from './providers'
import { getSiteUrl } from '@/lib/site-url'
import { jsonLdText } from '@/lib/seo'

// 字体自托管：替代 globals.css 里的 Google Fonts @import（渲染阻塞串行请求）
// 变量名保持 --font-switzer / --font-mono，tailwind 与 body 的引用无需改动
const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '700', '900'],
  style: ['normal', 'italic'],
  variable: '--font-switzer',
  display: 'swap',
})
const dmMono = DM_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: 'MindStack',
  description: 'MindStack：个人技术博客、AI 工程学习中心与作品集，记录架构理解、代码实践和可核对的实验思路。',
  manifest: '/manifest.json',
  // 全站默认 OG 分享卡（gallery/work 等页面各自覆盖）
  openGraph: {
    type: 'website',
    siteName: 'MindStack',
    images: [{ url: '/api/og?kind=home', width: 1200, height: 630 }],
  },
  appleWebApp: {
    capable: true,
    title: 'MindStack',
    statusBarStyle: 'default',
  },
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: '/apple-icon.png',
  },
}

// themeColor 在 Next.js 14 中需通过 viewport 导出生成 <meta name="theme-color">
export const viewport: Viewport = {
  themeColor: '#2563eb',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // WebSite schema：站点级结构化数据
  // Share the same absolute site identity as canonical, RSS and sitemap.
  const baseUrl = getSiteUrl()
  const websiteJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'MindStack',
    url: baseUrl || '/',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${baseUrl}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  }

  return (
    <html lang="zh" className={`${dmSans.variable} ${dmMono.variable}`}>
      <body className="overflow-x-hidden">
        {/* WebSite 结构化数据注入 */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLdText(websiteJsonLd) }}
        />
        <Providers>
          <CursorGlow />
          <CursorFollower />
          <AnalyticsTracker />
          <SiteShell>{children}</SiteShell>
        </Providers>
      </body>
    </html>
  )
}
