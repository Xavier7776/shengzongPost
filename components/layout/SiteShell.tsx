'use client'
// components/layout/SiteShell.tsx
import { usePathname } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import DarkNavbar from '@/components/layout/DarkNavbar'
import DarkFooter from '@/components/layout/DarkFooter'

export default function SiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isDark = pathname.startsWith('/gallery')
  const isAdmin = pathname.startsWith('/admin')
  // dashboard 编辑器页面自带 toolbar，不套全局导航
  const isDashboardEditor =
    pathname.startsWith('/dashboard/new') ||
    pathname.startsWith('/dashboard/edit')

  if (isAdmin || isDashboardEditor) {
    return <>{children}</>
  }

  return (
    <div
      className="min-h-screen flex flex-col overflow-x-hidden"
      style={{ background: isDark ? '#080808' : '#FAFAF8' }}
    >
      {isDark ? <DarkNavbar /> : <Navbar />}
      <main className="relative z-10 flex-1">{children}</main>
      {isDark ? <DarkFooter /> : <Footer />}
    </div>
  )
}
