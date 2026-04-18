import type { Metadata } from 'next'
import './globals.css'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import CursorGlow from '@/components/ui/CursorGlow'

export const metadata: Metadata = {
  title: 'ARC. — Architecture & Design',
  description: '以严谨的美学标准构建数字化体验',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh">
      <body className="min-h-screen bg-[#FAFAF8] overflow-x-hidden">
        <CursorGlow />
        <Navbar />
        <main className="relative z-10">{children}</main>
        <Footer />
      </body>
    </html>
  )
}
