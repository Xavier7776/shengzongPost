import type { Metadata } from 'next'
import './globals.css'
import CursorGlow from '@/components/ui/CursorGlow'
import SiteShell from '@/components/layout/SiteShell'

export const metadata: Metadata = {
  title: 'Xavier的个人博客',
  description: '以严谨的美学标准构建数字化体验',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh">
      <body className="overflow-x-hidden">
        <CursorGlow />
        <SiteShell>{children}</SiteShell>
      </body>
    </html>
  )
}
