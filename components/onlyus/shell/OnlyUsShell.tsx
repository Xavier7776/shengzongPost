'use client'

import { useEffect, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import SideNav from './SideNav'
import MobileBottomNav from './MobileBottomNav'
import BackgroundBlobs from './BackgroundBlobs'
import { useOnlyUsAuthStore } from '@/stores/onlyus/authStore'
import { useIsMobile } from '@/lib/hooks'

export default function OnlyUsShell({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { currentUserId, isReady, init } = useOnlyUsAuthStore()
  const initialized = useRef(false)
  const isMobile = useIsMobile()

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true
    init()
  }, [init])

  // 未选人时跳回落地页
  useEffect(() => {
    if (isReady && !currentUserId) {
      router.replace('/onlyus')
    }
  }, [isReady, currentUserId, router])

  if (!isReady || !currentUserId) {
    return (
      <div style={{
        position: 'fixed', inset: 0, background: '#F8F6F3',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{
              width: 6, height: 6, borderRadius: '50%',
              background: '#C4785A', opacity: 0.6,
              animation: `onlyus-bounce 1.2s ease-in-out ${i * 0.18}s infinite`,
            }} />
          ))}
        </div>
        <style>{`
          @keyframes onlyus-bounce {
            0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
            40% { transform: translateY(-8px); opacity: 1; }
          }
        `}</style>
      </div>
    )
  }

  if (isMobile) {
    return (
      <div style={{
        position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column',
        background: '#F8F6F3', overflow: 'hidden',
      }}>
        <BackgroundBlobs />
        <main style={{
          flex: 1, overflowY: 'auto', overflowX: 'hidden',
          paddingBottom: 'calc(56px + env(safe-area-inset-bottom, 0px))',
          position: 'relative', zIndex: 10,
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(196,120,90,0.2) transparent',
        }}>
          {children}
        </main>
        <MobileBottomNav pathname={pathname} />
      </div>
    )
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, display: 'flex',
      background: '#F8F6F3', overflow: 'hidden',
    }}>
      {/* 背景流动光斑 */}
      <BackgroundBlobs />

      {/* 左侧导航 */}
      <SideNav pathname={pathname} />

      {/* 右侧内容区 */}
      <main style={{
        flex: 1, overflowY: 'auto', overflowX: 'hidden',
        position: 'relative', zIndex: 10,
        scrollbarWidth: 'thin',
        scrollbarColor: 'rgba(196,120,90,0.2) transparent',
      }}>
        {children}
      </main>
    </div>
  )
}
