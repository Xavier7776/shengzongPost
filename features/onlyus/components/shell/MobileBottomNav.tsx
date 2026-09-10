'use client'

import Link from 'next/link'
import { NAV_ITEMS } from './navItems'

interface MobileBottomNavProps {
  pathname: string
}

export default function MobileBottomNav({ pathname }: MobileBottomNavProps) {
  return (
    <nav style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      height: 'calc(56px + env(safe-area-inset-bottom, 0px))',
      paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-around',
      background: 'rgba(248,246,243,0.88)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      borderTop: '1px solid rgba(196,120,90,0.1)',
      zIndex: 50,
    }}>
      {NAV_ITEMS.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
        return (
          <Link
            key={item.href}
            href={item.href}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 3,
              textDecoration: 'none',
              color: isActive ? '#C4785A' : 'rgba(61,35,24,0.35)',
              transition: 'color 0.18s ease',
              padding: '6px 0',
              position: 'relative',
              minWidth: 48,
            }}
          >
            <div style={{ width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {item.icon}
            </div>
            <span style={{
              fontSize: 9,
              fontFamily: "'DM Sans', sans-serif",
              letterSpacing: '0.04em',
              lineHeight: 1,
            }}>
              {item.label}
            </span>
            {isActive && (
              <div style={{
                position: 'absolute',
                bottom: 2,
                width: 4,
                height: 4,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #C4785A, #E8849C)',
              }} />
            )}
          </Link>
        )
      })}
    </nav>
  )
}
