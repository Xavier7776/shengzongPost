'use client'

import Image from 'next/image'
import { useState, useEffect, useRef, useCallback, useId } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { Menu, X, LogOut, User, PenLine, ChevronRight, Search, Bell, LayoutDashboard } from 'lucide-react'
import UserMenu from '@/components/layout/UserMenu'
import RoleBadge from '@/components/ui/RoleBadge'
import NotificationBell from '@/components/layout/NotificationBell'
import { useHydrated } from '@/shared/browser-state'

const NAV_ITEMS = [
  { label: '首页',     href: '/' },
  { label: '博客',     href: '/blog' },
  { label: '精读',     href: '/learn' },
  { label: '热门',     href: '/skills' },
  { label: '个人项目', href: '/work' },
  { label: '关于',     href: '/projects' },
]
const ADMIN_NAV_ITEMS = [...NAV_ITEMS.slice(0, 3), { label: '学习', href: '/study' }, ...NAV_ITEMS.slice(3)]

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [menuOpen,   setMenuOpen]   = useState(false)
  const [swinging,   setSwinging]   = useState(false)
  const [hidden,     setHidden]     = useState(false)   // 下滚隐藏、上滚出现
  const hydrated = useHydrated()
  const pathname  = usePathname()
  const isArticleReader = hydrated && /^\/blog\/[^/]+/.test(pathname)
  const router    = useRouter()
  const drawerRef = useRef<HTMLDialogElement>(null)
  const progressRef = useRef<HTMLDivElement>(null)
  const drawerId = useId()
  const pressedOutside = useRef(false)
  const { data: session } = useSession()

  const handleClose = useCallback(async () => {
    const drawer = drawerRef.current
    if (!drawer?.open || drawer.hasAttribute('data-closing')) return
    // Keep the native modal active until its exit completes, including on Safari/Firefox.
    drawer.setAttribute('data-closing', '')
    await Promise.allSettled(drawer.getAnimations({ subtree: true }).map(animation => animation.finished))
    if (drawer.isConnected && drawer.hasAttribute('data-closing')) {
      drawer.close()
      drawer.removeAttribute('data-closing')
    }
  }, [])

  useEffect(() => {
    let lastY = window.scrollY
    let frame: number | null = null
    const update = () => {
      frame = null
      const y = window.scrollY
      setIsScrolled(y > 20)

      // 阅读进度：当前屏占比
      const total = document.documentElement.scrollHeight - window.innerHeight
      const progress = total > 0 ? Math.max(0, Math.min(1, y / total)) : 0
      if (progressRef.current) {
        progressRef.current.style.transform = `scaleX(${progress})`
        progressRef.current.style.opacity = progress > 0.005 ? '1' : '0'
      }

      // 方向感知：下滚且离开顶部时隐藏，上滚或回到顶部时出现；抽屉打开时不隐藏
      if (!menuOpen) {
        if (y > lastY && y > 240) setHidden(true)
        else if (y < lastY - 4 || y <= 240) setHidden(false)
      }
      lastY = y
    }
    const handler = () => { if (frame === null) frame = requestAnimationFrame(update) }
    update()
    window.addEventListener('scroll', handler, { passive: true })
    window.addEventListener('resize', handler)
    return () => {
      window.removeEventListener('scroll', handler)
      window.removeEventListener('resize', handler)
      if (frame !== null) cancelAnimationFrame(frame)
    }
  }, [menuOpen, pathname])

  // 路由变化时触发 Logo 摇摆
  useEffect(() => {
    const frame = requestAnimationFrame(() => setSwinging(true))
    const t = setTimeout(() => setSwinging(false), 700)
    void handleClose()
    return () => { cancelAnimationFrame(frame); clearTimeout(t) }
  }, [pathname, handleClose])

  // Cmd/Ctrl + K 唤起搜索
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        router.push('/search')
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [router])

  useEffect(() => {
    const desktop = window.matchMedia('(min-width: 768px)')
    const sync = () => { if (desktop.matches) void handleClose() }
    desktop.addEventListener('change', sync)
    return () => desktop.removeEventListener('change', sync)
  }, [handleClose])

  function handleOpen() {
    const drawer = drawerRef.current
    if (!drawer) return
    drawer.removeAttribute('data-closing')
    drawer.showModal()
    setMenuOpen(true)
  }

  const name    = session?.user?.name ?? ''
  const avatar  = session?.user?.image ?? null
  const role    = (session?.user as { role?: string })?.role ?? 'user'
  const isAdmin = role === 'admin'
  const navItems = isAdmin ? ADMIN_NAV_ITEMS : NAV_ITEMS
  const userId  = (session?.user as { id?: string })?.id
  const initial = name.charAt(0).toUpperCase()

  // /work/[slug] 详情页：Navbar 不 fixed，跟随页面滚动（普通文档流）
  const isWorkDetail = /^\/work\/[^/]+/.test(pathname)
  const isGalleryHero = pathname === '/gallery' && !isScrolled

  const navCls = isWorkDetail
    ? 'relative bg-white border-b border-gray-100 py-4'
    : isArticleReader ? 'reader-site-nav fixed top-0 left-0 right-0 z-50'
    : [
        'fixed top-0 left-0 right-0 z-50 transition-all duration-500',
        hidden && !menuOpen ? '-translate-y-full' : 'translate-y-0',
        isScrolled
          ? 'bg-white/80 backdrop-blur-xl border-b border-gray-100 py-4'
          : 'bg-transparent py-6',
      ].join(' ')

  return (
    <>
      {/* ── 顶栏 ── */}
      <nav className={navCls} onMouseEnter={() => setHidden(false)} onFocusCapture={() => setHidden(false)} aria-label="主导航">
        {/* 阅读进度条 */}
        {!isWorkDetail && (
          <div ref={progressRef} aria-hidden="true" className="absolute bottom-0 left-0 right-0 h-[2px] origin-left bg-gradient-to-r from-blue-600 to-sky-400"
            style={{ transform: 'scaleX(0)', opacity: 0 }}
          />
        )}
        <div className={`${isArticleReader ? 'reader-site-nav-inner' : pathname === '/gallery' ? 'relative px-5 sm:px-8 lg:px-12' : 'max-w-6xl mx-auto px-6'} flex items-center justify-between`}>

          {/* Logo */}
          <Link href="/" prefetch={false} className="flex items-center gap-2.5">
            <Image
              src="/logo.png"
              alt="MindStack"
              width={32}
              height={32}
              className={`w-8 h-8 rounded-full${swinging ? ' logo-swing' : ''}`}
            />
            <span className={`tracking-tighter text-2xl font-black transition-colors ${isGalleryHero ? 'text-white' : 'text-gray-900'}`}>
              Mind<span className={isGalleryHero ? 'text-white' : 'text-blue-600'}>Stack</span>
            </span>
            {isArticleReader && <span className="reader-site-label">技术手册</span>}
          </Link>

          {/* 桌面端导航 */}
          <div className={`hidden items-center md:flex ${isAdmin ? 'space-x-4 lg:space-x-7 xl:space-x-10' : 'space-x-10'} ${isArticleReader ? 'reader-desktop-links' : ''} ${pathname === '/gallery' && !isAdmin ? 'md:absolute md:left-1/2 md:-translate-x-1/2' : ''}`}>
            {navItems.map(({ label, href }) => {
              const isActive = hydrated && (href === '/' ? pathname === '/' : pathname.startsWith(href))
              return (
                <Link
                  key={href}
                  href={href}
                  prefetch={false}
                  aria-current={isActive ? 'page' : undefined}
                  className={`whitespace-nowrap capitalize text-xs font-black tracking-widest transition-all duration-300 relative py-2 ${
                    isGalleryHero
                      ? isActive ? 'text-white' : 'text-white/65 hover:text-white'
                      : isActive ? 'text-gray-900' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {label}
                  {isActive && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />}
                </Link>
              )
            })}
            {/* 通知铃铛 */}
            <NotificationBell dark={isGalleryHero} />
            {/* 搜索入口：跳转 /search（原 ⌘K 命令面板已移除） */}
            <Link
              href="/search"
              prefetch={false}
              className={`flex items-center gap-2 text-xs font-black tracking-widest transition-colors py-2 ${isGalleryHero ? 'text-white/65 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
              title="搜索 (Cmd/Ctrl + K)"
            >
              <Search className="w-4 h-4" />
              <span className="hidden lg:inline">搜索</span>
              <kbd className={`hidden lg:inline-block text-[10px] font-mono rounded px-1.5 py-0.5 ${isGalleryHero ? 'border border-white/10 bg-white/10 text-white/50' : 'border border-gray-200 bg-gray-100 text-gray-600'}`}>
                ⌘K
              </kbd>
            </Link>
            <UserMenu dark={isGalleryHero} />
          </div>

          {/* 移动端右侧 */}
          <div className={`flex md:hidden items-center gap-2 ${isArticleReader ? 'reader-mobile-links' : ''}`}>
            <NotificationBell dark={isGalleryHero} />
            {session ? (
              <Link href={userId ? `/profile/${userId}` : '/profile'}>
                <div className="w-8 h-8 rounded-full overflow-hidden ring-2 ring-transparent hover:ring-blue-500 transition-all">
                  {avatar
                    ? <Image src={avatar} alt={name} width={32} height={32} unoptimized className="w-full h-full object-cover" />
                    : <div className="w-full h-full bg-blue-600 flex items-center justify-center">
                        <span className="text-white text-xs font-black">{initial}</span>
                      </div>
                  }
                </div>
              </Link>
            ) : (
              <Link href="/login" prefetch={false} className={`text-xs font-black transition-colors px-3 py-1.5 rounded-xl border ${isGalleryHero ? 'border-white/20 text-white/70 hover:border-white/40 hover:text-white' : 'border-gray-200 text-gray-500 hover:text-gray-900'}`}>
                登录
              </Link>
            )}
            <button
              onClick={handleOpen}
              className={`w-9 h-9 flex items-center justify-center rounded-xl transition-colors ${isGalleryHero ? 'hover:bg-white/10' : 'hover:bg-gray-100'}`}
              aria-label="打开菜单"
              aria-expanded={menuOpen}
              aria-controls={drawerId}
            >
              <Menu className={`w-5 h-5 ${isGalleryHero ? 'text-white' : 'text-gray-700'}`} />
            </button>
          </div>
        </div>
      </nav>

      {/* ── 移动端抽屉 ── */}
          <dialog
            ref={drawerRef}
            id={drawerId}
            aria-label="站点导航"
            closedby="any"
            className="site-drawer"
            onClose={() => setMenuOpen(false)}
            onCancel={event => { if (event.cancelable) { event.preventDefault(); void handleClose() } }}
            onPointerDown={event => {
              if ('closedBy' in HTMLDialogElement.prototype) return
              const rect = event.currentTarget.getBoundingClientRect()
              pressedOutside.current = event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom
            }}
            onPointerUp={event => {
              if ('closedBy' in HTMLDialogElement.prototype) return
              const rect = event.currentTarget.getBoundingClientRect()
              const outside = event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom
              if (pressedOutside.current && outside) void handleClose()
              pressedOutside.current = false
            }}
          >
            {/* 抽屉顶部 */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-50">
              <Link href="/" prefetch={false} onClick={handleClose} className="flex items-center gap-2">
                <Image src="/logo.png" alt="MindStack" width={24} height={24} className="w-6 h-6 rounded-full" />
                <span className="tracking-tighter text-lg font-black text-gray-900">
                  Mind<span className="text-blue-600">Stack</span>
                </span>
              </Link>
              <button
                onClick={handleClose}
                aria-label="关闭导航"
                autoFocus
                className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            {/* 导航 + 账号 */}
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain py-4 px-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-600 px-3 mb-2">导航</p>
              {navItems.map(({ label, href }) => {
                const isActive = hydrated && (href === '/' ? pathname === '/' : pathname.startsWith(href))
                return (
                  <Link
                    key={href}
                    href={href}
                    prefetch={false}
                    onClick={handleClose}
                    aria-current={isActive ? 'page' : undefined}
                    className={`flex items-center justify-between px-3 py-3 rounded-xl text-sm font-bold transition-colors ${
                      isActive ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <span className="capitalize">{label}</span>
                    {isActive
                      ? <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                      : <ChevronRight className="w-4 h-4 text-gray-600" />
                    }
                  </Link>
                )
              })}

              {/* 搜索入口 */}
              <Link
                href="/search"
                prefetch={false}
                onClick={handleClose}
                className="flex items-center justify-between px-3 py-3 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Search className="w-4 h-4 text-gray-600" />
                  搜索
                </span>
                <kbd className="text-[10px] font-mono text-gray-600 bg-gray-100 border border-gray-200 rounded px-1.5 py-0.5">
                  ⌘K
                </kbd>
              </Link>

              {/* 通知入口（仅登录用户） */}
              {session && (
                <Link
                  href="/notifications"
                  onClick={handleClose}
                  className="flex items-center justify-between px-3 py-3 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-gray-600" />
                    通知中心
                  </span>
                </Link>
              )}

              {session && (
                <>
                  <div className="my-3 border-t border-gray-50" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-600 px-3 mb-2">账号</p>

                  {/* 用户信息 */}
                  <div className="flex items-center gap-3 px-3 py-3 mb-1">
                    <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 bg-blue-100">
                      {avatar
                        ? <Image src={avatar} alt={name} width={36} height={36} unoptimized className="w-full h-full object-cover" />
                        : <div className="w-full h-full bg-blue-600 flex items-center justify-center">
                            <span className="text-white text-sm font-black">{initial}</span>
                          </div>
                      }
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-sm font-black text-gray-900 truncate">{name}</span>
                        <RoleBadge role={role} size="sm" />
                      </div>
                      <span className="text-xs text-gray-600 truncate block">{session.user?.email}</span>
                    </div>
                  </div>

                  <Link href={userId ? `/profile/${userId}` : '/profile'} onClick={handleClose}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                    <User className="w-4 h-4 text-gray-600" />个人主页
                  </Link>
                  <Link href="/profile" onClick={handleClose}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                    <PenLine className="w-4 h-4 text-gray-600" />编辑资料
                  </Link>
                  <Link href="/dashboard" onClick={handleClose}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                    <PenLine className="w-4 h-4 text-gray-600" />编辑中心
                  </Link>
                  {/* 管理后台：仅管理员可见（此前 /admin 无任何全局入口） */}
                  {role === 'admin' && (
                    <Link href="/admin" onClick={handleClose}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-blue-600 hover:bg-blue-50 transition-colors">
                      <LayoutDashboard className="w-4 h-4" />管理后台
                    </Link>
                  )}
                </>
              )}
            </div>

            {/* 底部退出 */}
            {session ? (
              <div className="px-3 py-4 border-t border-gray-50">
                <button
                  onClick={() => { handleClose(); signOut({ callbackUrl: '/' }) }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-500 hover:bg-red-50 transition-colors font-bold"
                >
                  <LogOut className="w-4 h-4" />退出登录
                </button>
              </div>
            ) : (
              <div className="px-3 py-4 border-t border-gray-50">
                <Link href="/login" prefetch={false} onClick={handleClose}
                  className="w-full flex items-center justify-center py-2.5 rounded-xl text-sm font-black text-white bg-blue-600 hover:bg-blue-700 transition-colors">
                  登录 / 注册
                </Link>
              </div>
            )}
          </dialog>
    </>
  )
}
