'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useOnlyUsAuthStore } from '@/stores/onlyus/authStore'
import { NAV_ITEMS } from './navItems'

interface SideNavProps {
  pathname: string
}

export default function SideNav({ pathname }: SideNavProps) {
  const router = useRouter()
  const { profile, partner, signOut } = useOnlyUsAuthStore()
  const [tooltip, setTooltip] = useState<string | null>(null)
  const [tooltipY, setTooltipY] = useState(0)
  const [confirmSignOut, setConfirmSignOut] = useState(false)

  const handleSignOut = () => {
    if (!confirmSignOut) {
      setConfirmSignOut(true)
      setTimeout(() => setConfirmSignOut(false), 2500)
      return
    }
    signOut()
    router.replace('/onlyus')
  }

  const avatarBg = profile?.avatar_url ? undefined : '#E8849C'
  const initial = profile?.nickname?.[0]?.toUpperCase() ?? '?'

  return (
    <>
      <style>{`
        @keyframes onlyus-tooltip-in {
          from { opacity: 0; transform: translateX(-4px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes onlyus-avatar-ping {
          0% { transform: scale(1); opacity: 0.8; }
          100% { transform: scale(1.6); opacity: 0; }
        }
      `}</style>

      <nav style={{
        width: 56, flexShrink: 0, height: '100%',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        paddingTop: 16, paddingBottom: 16,
        borderRight: '1px solid rgba(196,120,90,0.1)',
        background: 'rgba(248,246,243,0.7)',
        backdropFilter: 'blur(12px)',
        position: 'relative', zIndex: 50,
        gap: 4,
      }}>
        {/* Logo心形 */}
        <div style={{ marginBottom: 8, padding: '6px 0' }}>
          <svg width="22" height="20" viewBox="0 0 24 22" fill="none">
            <path
              d="M12 20.5C12 20.5 2 13.5 2 7.5C2 4.46 4.46 2 7.5 2C9.24 2 10.91 2.81 12 4.08C13.09 2.81 14.76 2 16.5 2C19.54 2 22 4.46 22 7.5C22 13.5 12 20.5 12 20.5Z"
              fill="url(#heart-nav-grad)"
              opacity="0.9"
            />
            <defs>
              <linearGradient id="heart-nav-grad" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#C4785A"/>
                <stop offset="100%" stopColor="#E8849C"/>
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* 分隔线 */}
        <div style={{
          width: 24, height: 1,
          background: 'linear-gradient(to right, transparent, rgba(196,120,90,0.3), transparent)',
          marginBottom: 8,
        }} />

        {/* 导航图标 */}
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              onMouseEnter={(e) => {
                setTooltip(item.label)
                setTooltipY((e.currentTarget as HTMLElement).getBoundingClientRect().top + 14)
              }}
              onMouseLeave={() => setTooltip(null)}
              style={{
                width: 40, height: 40, borderRadius: 12,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: isActive ? '#C4785A' : 'rgba(61,35,24,0.4)',
                background: isActive
                  ? 'linear-gradient(135deg, rgba(196,120,90,0.12), rgba(232,132,156,0.08))'
                  : 'transparent',
                border: isActive ? '1px solid rgba(196,120,90,0.2)' : '1px solid transparent',
                transition: 'all 0.18s ease',
                textDecoration: 'none',
                position: 'relative',
              }}
            >
              {item.icon}
              {isActive && (
                <div style={{
                  position: 'absolute', left: -1, top: '50%',
                  transform: 'translateY(-50%)',
                  width: 3, height: 16, borderRadius: '0 2px 2px 0',
                  background: 'linear-gradient(to bottom, #C4785A, #E8849C)',
                }} />
              )}
            </Link>
          )
        })}

        {/* 底部：头像 + 退出 */}
        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          {/* 分隔线 */}
          <div style={{
            width: 24, height: 1,
            background: 'linear-gradient(to right, transparent, rgba(196,120,90,0.2), transparent)',
          }} />

          {/* 头像 */}
          <div
            onMouseEnter={(e) => {
              setTooltip(profile?.nickname ?? 'Me')
              setTooltipY((e.currentTarget as HTMLElement).getBoundingClientRect().top + 14)
            }}
            onMouseLeave={() => setTooltip(null)}
            style={{ position: 'relative' }}
          >
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: avatarBg ?? 'transparent',
              border: '2px solid rgba(196,120,90,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: 13, fontWeight: 600,
              overflow: 'hidden', cursor: 'default',
              fontFamily: "'DM Sans', sans-serif",
            }}>
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : initial}
            </div>
          </div>

          {/* 退出按钮 */}
          <button
            onClick={handleSignOut}
            onMouseEnter={(e) => {
              setTooltip(confirmSignOut ? '再按一次确认' : '切换用户')
              setTooltipY((e.currentTarget as HTMLElement).getBoundingClientRect().top + 14)
            }}
            onMouseLeave={() => setTooltip(null)}
            style={{
              width: 32, height: 32, borderRadius: 8,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: confirmSignOut ? 'rgba(232,132,156,0.15)' : 'transparent',
              border: confirmSignOut ? '1px solid rgba(232,132,156,0.4)' : '1px solid transparent',
              color: confirmSignOut ? '#E8849C' : 'rgba(61,35,24,0.3)',
              cursor: 'pointer', transition: 'all 0.18s ease',
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
              <polyline points="16,17 21,12 16,7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </button>
        </div>
      </nav>

      {/* Tooltip */}
      {tooltip && (
        <div style={{
          position: 'fixed',
          left: 64,
          top: tooltipY,
          background: 'rgba(61,35,24,0.85)',
          backdropFilter: 'blur(8px)',
          color: '#F8F6F3',
          fontSize: 11,
          fontFamily: "'DM Sans', sans-serif",
          letterSpacing: '0.04em',
          padding: '4px 10px',
          borderRadius: 6,
          pointerEvents: 'none',
          zIndex: 9999,
          whiteSpace: 'nowrap',
          animation: 'onlyus-tooltip-in 0.12s ease forwards',
        }}>
          {tooltip}
        </div>
      )}
    </>
  )
}
