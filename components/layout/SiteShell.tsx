'use client'
// components/layout/SiteShell.tsx
import { useEffect, useState, useRef } from 'react'
import { usePathname } from 'next/navigation'
import dynamic from 'next/dynamic'
import Navbar from '@/components/layout/Navbar'
import BackToTop from '@/components/ui/BackToTop'

const FOOTER_PLACEHOLDER_H = 'calc((min(100vw, 1600px) + 40px) / 3.83228)'

const DistortionEffect = dynamic(() => import('@/components/sections/DistortionEffect'), {
  ssr: false,
  loading: () => <div style={{ height: FOOTER_PLACEHOLDER_H, opacity: 0 }} />,
})

export default function SiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isAdmin = pathname.startsWith('/admin')
  const isDashboardEditor =
    pathname.startsWith('/dashboard/new') ||
    pathname.startsWith('/dashboard/edit')
  const isOnlyUs = pathname.startsWith('/onlyus')
  // /skills/research 有自己的工具栏（含用户头像菜单），跳过全局 Navbar/Footer
  const isResearch = pathname.startsWith('/skills/research')
  // /work/[slug] 详情页有自己的顶部导航条（普通文档流，跟随滚动）
  // 避免 fixed Navbar 遮挡内容，跳过全局 Navbar/Footer
  const isWorkDetail = /^\/work\/[^/]+/.test(pathname)
  // /work/[slug]/pdf 是独立打印页，不渲染 Navbar/Footer
  const isPdfPage = /^\/work\/[^/]+\/pdf$/.test(pathname)

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

  if (isPdfPage) {
    // /work/[slug]/pdf 独立打印页：不渲染 Navbar/Footer，全屏展示
    return <div className="min-h-screen">{children}</div>
  }

  if (isWorkDetail) {
    // /work/[slug] 详情页：
    // - 渲染全局 Navbar（Navbar 内部已对 /work/[slug] 改用 relative 定位，跟随页面滚动）
    // - 渲染全局 Footer（DistortionEffect）
    // - 不用 overflow-x-hidden：它会创建滚动容器，破坏详情页 TOC 的 sticky 定位
    return (
      <div
        className="min-h-screen flex flex-col"
        style={{ background: '#FAFAF8' }}
      >
        <Navbar />
        <main className="relative z-10 flex-1">{children}</main>
        <div ref={sentinelRef} style={{ height: 1 }} aria-hidden />
        {showFooter ? (
          <DistortionEffect />
        ) : (
          <div style={{ height: FOOTER_PLACEHOLDER_H }} aria-hidden />
        )}
      </div>
    )
  }

  if (isAdmin || isDashboardEditor || isOnlyUs || isResearch) {
    return <div className="min-h-screen">{children}</div>
  }

  return (
    <div
      className="min-h-screen flex flex-col overflow-x-hidden"
      style={{ background: '#FAFAF8' }}
    >
      <Navbar />
      <main className="relative z-10 flex-1">{children}</main>
      {/* 哨兵元素：当它进入视口时才加载页脚 */}
      <div ref={sentinelRef} style={{ height: 1 }} aria-hidden />
      {showFooter ? (
        <DistortionEffect />
      ) : (
        <div style={{ height: FOOTER_PLACEHOLDER_H }} aria-hidden />
      )}
      {/* 全局回到顶部 */}
      <BackToTop />
    </div>
  )
}
