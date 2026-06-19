'use client'
// components/layout/SiteShell.tsx
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import dynamic from 'next/dynamic'
import Navbar from '@/components/layout/Navbar'
import DarkNavbar from '@/components/layout/DarkNavbar'
import DarkFooter from '@/components/layout/DarkFooter'

const FOOTER_PLACEHOLDER_H = 'calc((min(100vw, 1600px) + 40px) / 3.83228)'

const DistortionEffect = dynamic(() => import('@/components/sections/DistortionEffect'), {
  ssr: false,
  loading: () => <div style={{ height: FOOTER_PLACEHOLDER_H, opacity: 0 }} />,
})

export default function SiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isDark = pathname.startsWith('/gallery')
  const isAdmin = pathname.startsWith('/admin')
  const isDashboardEditor =
    pathname.startsWith('/dashboard/new') ||
    pathname.startsWith('/dashboard/edit')
  const isOnlyUs = pathname.startsWith('/onlyus')

  // 延迟页脚渲染，确保页面内容先于页脚出现
  const [showFooter, setShowFooter] = useState(false)
  useEffect(() => {
    setShowFooter(false)
    const t = setTimeout(() => setShowFooter(true), 500)
    return () => clearTimeout(t)
  }, [pathname])

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
      {showFooter ? (
        isDark ? <DarkFooter /> : <DistortionEffect />
      ) : (
        <div style={{ height: FOOTER_PLACEHOLDER_H }} aria-hidden />
      )}
    </div>
  )
}
