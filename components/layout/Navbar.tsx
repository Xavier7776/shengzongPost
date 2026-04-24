'use client'
import Image from 'next/image'


import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import UserMenu from '@/components/layout/UserMenu'

const NAV_ITEMS = [
  { label: 'home', href: '/' },
  { label: 'blog', href: '/blog' },
  { label: 'gallery', href: '/gallery' },
  { label: 'projects', href: '/projects' },
]

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    const handler = () => setIsScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled ? 'bg-white/80 backdrop-blur-xl border-b border-gray-100 py-4' : 'bg-transparent py-6'
      }`}
    >
      <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <Image src="/logo.png" alt="MindStack" width={32} height={32} className="w-8 h-8 rounded-full" />
          <span className="tracking-tighter text-2xl font-black text-gray-900">
            Mind<span className="text-blue-600">Stack</span>
          </span>
        </Link>

        <div className="flex items-center space-x-6 md:space-x-10">
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
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
                )}
              </Link>
            )
          })}

          {/* 用户菜单 */}
          <UserMenu dark={false} />
        </div>
      </div>
    </nav>
  )
}
