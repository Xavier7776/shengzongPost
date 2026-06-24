'use client'
// components/layout/SiteShell.tsx
import { useEffect, useState, useRef } from 'react'
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
  // /skills/research 有自己的工具栏（含用户头像菜单），跳过全局 Navbar/Footer
  const isResearch = pathname.startsWith('/skills/research')

  // 用 IntersectionObserver 检测哨兵元素是否进入视口，只在页脚即将可见时才渲染
  const sentinelRef = useRef<HTMLDivElement>(null)
  const [showFooter, setShowFooter] = useState(false)

  useEffect(() => {
    setShowFooter(false)
    const el = sentinelRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShowFooter(true)
          observer.disconnect()
        }
      },
      { rootMargin: '200px 0px' } // 提前 200px 触发，避免用户看到空白
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [pathname])

  if (isAdmin || isDashboardEditor || isOnlyUs || isResearch) {
    return <>{children}</>
  }

  return (
    <div
      className="min-h-screen flex flex-col overflow-x-hidden"
      style={{ background: isDark ? '#080808' : '#FAFAF8' }}
    >
      {isDark ? <DarkNavbar /> : <Navbar />}
      <main className="relative z-10 flex-1">{children}</main>
      {/* 哨兵元素：当它进入视口时才加载页脚 */}
      <div ref={sentinelRef} style={{ height: 1 }} aria-hidden />
      {showFooter ? (
        isDark ? <DarkFooter /> : <DistortionEffect />
      ) : (
        <div style={{ height: FOOTER_PLACEHOLDER_H }} aria-hidden />
      )}
    </div>
  )
}
