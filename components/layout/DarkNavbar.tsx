'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_ITEMS = [
  { label: 'home', href: '/' },
  { label: 'blog', href: '/blog' },
  { label: 'gallery', href: '/gallery' },
  { label: 'projects', href: '/projects' },
]

export default function DarkNavbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    const handler = () => setIsScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  return (
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
        <Link
          href="/"
          className="tracking-tighter text-2xl font-black transition-colors duration-300"
          style={{ color: '#e8e8e8' }}
        >
          ARC<span style={{ color: '#c8a97e' }}>.</span>
        </Link>

        <div className="flex space-x-6 md:space-x-10">
          {NAV_ITEMS.map(({ label, href }) => {
            const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                className="capitalize text-xs font-black tracking-widest transition-all duration-300 relative py-2"
                style={{
                  color: isActive ? '#e8e8e8' : 'rgba(255,255,255,0.3)',
                }}
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
        </div>
      </div>
    </nav>
  )
}
