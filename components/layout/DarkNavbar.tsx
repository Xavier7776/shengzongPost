'use client'

import Image from 'next/image'


import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { Menu, X, LogOut, User, PenLine, ChevronRight, Search } from 'lucide-react'
import UserMenu from '@/components/layout/UserMenu'
import RoleBadge from '@/components/ui/RoleBadge'

const NAV_ITEMS = [
  { label: 'home',     href: '/' },
  { label: 'blog',     href: '/blog' },
  { label: 'skills',   href: '/skills' },
  { label: 'projects', href: '/projects' },
]

export default function DarkNavbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [visible, setVisible] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const { data: session } = useSession()

  useEffect(() => {
    const handler = () => setIsScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  // 路由变化时关闭抽屉
  useEffect(() => { handleClose() }, [pathname])

  // Escape 关闭抽屉
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') handleClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

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
      <nav
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-500"
        style={{
          background: isScrolled ? 'rgba(8,8,8,0.85)' : 'transparent',
          backdropFilter: isScrolled ? 'blur(20px)' : 'none',
          borderBottom: isScrolled ? '1px solid rgba(255,255,255,0.05)' : 'none',
          padding: isScrolled ? '16px 0' : '24px 0',
        }}
      >
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <Image src="/logo.png" alt="MindStack" width={32} height={32} className="w-8 h-8 rounded-full" />
            <span className="tracking-tighter text-2xl font-black" style={{ color: '#e8e8e8' }}>
              Mind<span style={{ color: '#c8a97e' }}>Stack</span>
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
                  className="capitalize text-xs font-black tracking-widest transition-all duration-300 relative py-2"
                  style={{ color: isActive ? '#e8e8e8' : 'rgba(255,255,255,0.3)' }}
                >
                  {label}
                  {isActive && (
                    <span
                      className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                      style={{ background: '#c8a97e' }}
                    />
                  )}
                </Link>
              )
            })}
            {/* 搜索按钮 */}
            <Link
              href="/search"
              className="flex items-center gap-2 text-xs font-black tracking-widest transition-colors py-2"
              style={{ color: 'rgba(255,255,255,0.3)' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#e8e8e8')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.3)')}
              title="搜索 (Cmd/Ctrl + K)"
            >
              <Search className="w-4 h-4" />
              <span className="hidden lg:inline">搜索</span>
              <kbd
                className="hidden lg:inline-block text-[10px] font-mono rounded px-1.5 py-0.5"
                style={{
                  color: 'rgba(255,255,255,0.3)',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                ⌘K
              </kbd>
            </Link>
            <UserMenu dark={true} />
          </div>

          {/* 移动端右侧 */}
          <div className="flex md:hidden items-center gap-2">
            {session ? (
              <Link href={userId ? `/profile/${userId}` : '/profile'}>
                <div className="w-8 h-8 rounded-full overflow-hidden ring-2 ring-transparent hover:ring-[#c8a97e] transition-all">
                  {avatar
                    ? <Image src={avatar} alt={name} width={32} height={32} unoptimized className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center" style={{ background: '#c8a97e' }}>
                        <span className="text-white text-xs font-black">{initial}</span>
                      </div>
                  }
                </div>
              </Link>
            ) : (
              <Link
                href="/login"
                className="text-xs font-black transition-colors px-3 py-1.5 rounded-xl"
                style={{
                  color: 'rgba(255,255,255,0.5)',
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
              >
                登录
              </Link>
            )}
            <button
              onClick={handleOpen}
              className="w-9 h-9 flex items-center justify-center rounded-xl transition-colors"
              style={{ background: 'rgba(255,255,255,0.04)' }}
              aria-label="打开菜单"
            >
              <Menu className="w-5 h-5" style={{ color: '#e8e8e8' }} />
            </button>
          </div>
        </div>
      </nav>

      {/* ── 移动端抽屉 ── */}
      {menuOpen && (
        <>
          {/* 遮罩 */}
          <div
            className={`fixed inset-0 z-[60] bg-black/60 backdrop-blur-[2px] transition-opacity duration-[250ms] ${visible ? 'opacity-100' : 'opacity-0'}`}
            onClick={handleClose}
          />

          {/* 抽屉（深色风格） */}
          <div
            className={`fixed top-0 right-0 bottom-0 z-[70] w-[280px] shadow-2xl flex flex-col transition-transform duration-[250ms] ease-out ${visible ? 'translate-x-0' : 'translate-x-full'}`}
            style={{
              background: '#0f0f0f',
              borderLeft: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            {/* 抽屉顶部 */}
            <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <Link href="/" onClick={handleClose} className="flex items-center gap-2">
                <Image src="/logo.png" alt="MindStack" width={24} height={24} className="w-6 h-6 rounded-full" />
                <span className="tracking-tighter text-lg font-black" style={{ color: '#e8e8e8' }}>
                  Mind<span style={{ color: '#c8a97e' }}>Stack</span>
                </span>
              </Link>
              <button
                onClick={handleClose}
                className="w-8 h-8 flex items-center justify-center rounded-xl transition-colors"
                style={{ background: 'rgba(255,255,255,0.04)' }}
              >
                <X className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.5)' }} />
              </button>
            </div>

            {/* 导航 + 账号 */}
            <div className="flex-1 overflow-y-auto py-4 px-3">
              <p className="text-[10px] font-black uppercase tracking-widest px-3 mb-2" style={{ color: 'rgba(255,255,255,0.2)' }}>导航</p>
              {NAV_ITEMS.map(({ label, href }) => {
                const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href)
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={handleClose}
                    className="flex items-center justify-between px-3 py-3 rounded-xl text-sm font-bold transition-colors capitalize"
                    style={
                      isActive
                        ? { background: 'rgba(200,169,126,0.12)', color: '#c8a97e' }
                        : { color: 'rgba(255,255,255,0.6)' }
                    }
                    onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
                    onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
                  >
                    <span>{label}</span>
                    {isActive
                      ? <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#c8a97e' }} />
                      : <ChevronRight className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.2)' }} />
                    }
                  </Link>
                )
              })}

              {/* 搜索入口 */}
              <Link
                href="/search"
                onClick={handleClose}
                className="flex items-center justify-between px-3 py-3 rounded-xl text-sm font-bold transition-colors"
                style={{ color: 'rgba(255,255,255,0.6)' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <span className="flex items-center gap-2">
                  <Search className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.3)' }} />
                  搜索
                </span>
                <kbd
                  className="text-[10px] font-mono rounded px-1.5 py-0.5"
                  style={{
                    color: 'rgba(255,255,255,0.3)',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}
                >
                  ⌘K
                </kbd>
              </Link>

              {session && (
                <>
                  <div className="my-3" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }} />
                  <p className="text-[10px] font-black uppercase tracking-widest px-3 mb-2" style={{ color: 'rgba(255,255,255,0.2)' }}>账号</p>

                  {/* 用户信息 */}
                  <div className="flex items-center gap-3 px-3 py-3 mb-1">
                    <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0" style={{ background: 'rgba(200,169,126,0.15)' }}>
                      {avatar
                        ? <Image src={avatar} alt={name} width={36} height={36} unoptimized className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center" style={{ background: '#c8a97e' }}>
                            <span className="text-white text-sm font-black">{initial}</span>
                          </div>
                      }
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-sm font-black truncate" style={{ color: '#e8e8e8' }}>{name}</span>
                        <RoleBadge role={role} size="sm" />
                      </div>
                      <span className="text-xs truncate block" style={{ color: 'rgba(255,255,255,0.3)' }}>{session.user?.email}</span>
                    </div>
                  </div>

                  <Link href={userId ? `/profile/${userId}` : '/profile'} onClick={handleClose}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors"
                    style={{ color: 'rgba(255,255,255,0.6)' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <User className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.3)' }} />个人主页
                  </Link>
                  <Link href="/profile" onClick={handleClose}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors"
                    style={{ color: 'rgba(255,255,255,0.6)' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <PenLine className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.3)' }} />编辑资料
                  </Link>
                  <Link href="/dashboard" onClick={handleClose}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors"
                    style={{ color: 'rgba(255,255,255,0.6)' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <PenLine className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.3)' }} />编辑中心
                  </Link>
                </>
              )}
            </div>

            {/* 底部退出 */}
            {session ? (
              <div className="px-3 py-4" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <button
                  onClick={() => { handleClose(); signOut({ callbackUrl: '/' }) }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-colors"
                  style={{ color: '#ef4444' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.1)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <LogOut className="w-4 h-4" />退出登录
                </button>
              </div>
            ) : (
              <div className="px-3 py-4" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <Link href="/login" onClick={handleClose}
                  className="w-full flex items-center justify-center py-2.5 rounded-xl text-sm font-black text-white transition-colors"
                  style={{ background: '#c8a97e' }}
                  onMouseEnter={e => (e.currentTarget.style.opacity = '0.9')}
                  onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                >
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
