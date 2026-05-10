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
  const isDashboardEditor =
    pathname.startsWith('/dashboard/new') ||
    pathname.startsWith('/dashboard/edit')
  // onlyus 是独立全屏体验，不套全局导航和页脚
  const isOnlyUs = pathname.startsWith('/onlyus')

  if (isAdmin || isDashboardEditor || isOnlyUs) {
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
