import type { Metadata, Viewport } from 'next'
import './globals.css'
import CursorGlow from '@/components/ui/CursorGlow'
import CursorFollower from '@/components/ui/CursorFollower'
import SiteShell from '@/components/layout/SiteShell'
import PWARegister from '@/components/PWARegister'
import AnalyticsTracker from '@/components/AnalyticsTracker'
import Providers from './providers'

export const metadata: Metadata = {
  title: 'MindStack',
  description: 'MindStack — 以严谨的美学标准构建数字化体验',
  manifest: '/manifest.json',
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
  // url 优先取 NEXT_PUBLIC_SITE_URL，未配置时回退为相对路径（schema.org 接受相对 URL）
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? ''
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
    <html lang="zh">
      <body className="overflow-x-hidden">
        {/* WebSite 结构化数据注入 */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
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
