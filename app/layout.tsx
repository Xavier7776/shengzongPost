import type { Metadata } from 'next'
import './globals.css'
import CursorGlow from '@/components/ui/CursorGlow'
import SiteShell from '@/components/layout/SiteShell'
import Providers from './providers'

export const metadata: Metadata = {
  title: 'Xavier的个人博客',
  description: '以严谨的美学标准构建数字化体验',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh">
      <body className="overflow-x-hidden">
        <Providers>
          <CursorGlow />
          <SiteShell>{children}</SiteShell>
        </Providers>
      </body>
    </html>
  )
}
