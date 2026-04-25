'use client'

import Image from 'next/image'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { Menu, X, LogOut, User, PenLine, ChevronRight } from 'lucide-react'
import UserMenu from '@/components/layout/UserMenu'
import RoleBadge from '@/components/ui/RoleBadge'

const NAV_ITEMS = [
  { label: 'Home',     href: '/' },
  { label: 'Blog',     href: '/blog' },
  { label: 'Gallery',  href: '/gallery' },
  { label: 'Projects', href: '/projects' },
]

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [menuOpen,   setMenuOpen]   = useState(false)
  const [visible,    setVisible]    = useState(false)
  const pathname  = usePathname()
  const drawerRef = useRef<HTMLDivElement>(null)
  const { data: session } = useSession()

  useEffect(() => {
    const handler = () => setIsScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  useEffect(() => { handleClose() }, [pathname])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') handleClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])

  function handleOpen() {
    setMenuOpen(true)
    requestAnimationFrame(() => setVisible(true))
  }

  function handleClose() {
    setVisible(false)
    setTimeout(() => setMenuOpen(false), 250)
  }

  const name    = session?.user?.name ?? ''
  const avatar  = session?.user?.image ?? null
  const role    = (session?.user as { role?: string })?.role ?? 'user'
  const userId  = (session?.user as { id?: string })?.id
  const initial = name.charAt(0).toUpperCase()

  return (
    <>
      {/* ── 顶栏 ── */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled ? 'bg-white/80 backdrop-blur-xl border-b border-gray-100 py-4' : 'bg-transparent py-6'
      }`}>
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5">
            <Image src="/logo.png" alt="MindStack" width={32} height={32} className="w-8 h-8 rounded-full" />
            <span className="tracking-tighter text-2xl font-black text-gray-900">
              Mind<span className="text-blue-600">Stack</span>
            </span>
          </Link>

          {/* 桌面端导航 */}
          <div className="hidden md:flex items-center space-x-10">
            {NAV_ITEMS.map(({ label, href }) => {
              const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href)
              return (
                <Link
                  key={href}
                  href={href}
                  className={`capitalize text-xs font-black tracking-widest transition-all duration-300 relative py-2 ${
                    isActive ? 'text-gray-900' : 'text-gray-400 hover:text-gray-900'
                  }`}
                >
                  {label}
                  {isActive && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />}
                </Link>
              )
            })}
            <UserMenu dark={false} />
          </div>

          {/* 移动端右侧 */}
          <div className="flex md:hidden items-center gap-2">
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
              <Link href="/login" className="text-xs font-black text-gray-500 hover:text-gray-900 transition-colors px-3 py-1.5 rounded-xl border border-gray-200">
                登录
              </Link>
            )}
            <button
              onClick={handleOpen}
              className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors"
              aria-label="打开菜单"
            >
              <Menu className="w-5 h-5 text-gray-700" />
            </button>
          </div>
        </div>
      </nav>

      {/* ── 移动端抽屉 ── */}
      {menuOpen && (
        <>
          {/* 遮罩 */}
          <div
            className={`fixed inset-0 z-[60] bg-black/40 backdrop-blur-[2px] transition-opacity duration-[250ms] ${visible ? 'opacity-100' : 'opacity-0'}`}
            onClick={handleClose}
          />

          {/* 抽屉 */}
          <div
            ref={drawerRef}
            className={`fixed top-0 right-0 bottom-0 z-[70] w-[280px] bg-white shadow-2xl flex flex-col transition-transform duration-[250ms] ease-out ${visible ? 'translate-x-0' : 'translate-x-full'}`}
          >
            {/* 抽屉顶部 */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-50">
              <Link href="/" onClick={handleClose} className="flex items-center gap-2">
                <Image src="/logo.png" alt="MindStack" width={24} height={24} className="w-6 h-6 rounded-full" />
                <span className="tracking-tighter text-lg font-black text-gray-900">
                  Mind<span className="text-blue-600">Stack</span>
                </span>
              </Link>
              <button
                onClick={handleClose}
                className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            {/* 导航 + 账号 */}
            <div className="flex-1 overflow-y-auto py-4 px-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-300 px-3 mb-2">导航</p>
              {NAV_ITEMS.map(({ label, href }) => {
                const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href)
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={handleClose}
                    className={`flex items-center justify-between px-3 py-3 rounded-xl text-sm font-bold transition-colors ${
                      isActive ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <span className="capitalize">{label}</span>
                    {isActive
                      ? <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                      : <ChevronRight className="w-4 h-4 text-gray-300" />
                    }
                  </Link>
                )
              })}

              {session && (
                <>
                  <div className="my-3 border-t border-gray-50" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-300 px-3 mb-2">账号</p>

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
                      <span className="text-xs text-gray-400 truncate block">{session.user?.email}</span>
                    </div>
                  </div>

                  <Link href={userId ? `/profile/${userId}` : '/profile'} onClick={handleClose}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                    <User className="w-4 h-4 text-gray-400" />个人主页
                  </Link>
                  <Link href="/profile" onClick={handleClose}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                    <PenLine className="w-4 h-4 text-gray-400" />编辑资料
                  </Link>
                  <Link href="/dashboard" onClick={handleClose}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                    <PenLine className="w-4 h-4 text-gray-400" />编辑中心
                  </Link>
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
                <Link href="/login" onClick={handleClose}
                  className="w-full flex items-center justify-center py-2.5 rounded-xl text-sm font-black text-white bg-blue-600 hover:bg-blue-700 transition-colors">
                  登录 / 注册
                </Link>
              </div>
            )}
          </div>
        </>
      )}
    </>
  )
}
