// app/onlyus/page.tsx
'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import UserSelectButton from '@/components/onlyus/landing/UserSelectButton'
import { useOnlyUsAuthStore, USER_IDS } from '@/stores/onlyus/authStore'
import { getSupabaseClient } from '@/lib/supabase-client'

const HeartCrystal = dynamic(
  () => import('@/components/onlyus/landing/HeartCrystal'),
  { ssr: false }
)
const ParticleField = dynamic(
  () => import('@/components/onlyus/landing/ParticleField'),
  { ssr: false }
)

const STATIC_USERS = [
  {
    id: USER_IDS.user1,
    nickname: 'Xavier',
    role: 'me' as const,
  },
  {
    id: USER_IDS.user2,
    nickname: '特特',
    role: 'partner' as const,
  },
]

type Phase = 'idle' | 'enter' | 'ready' | 'burst' | 'fade' | 'done'

export default function OnlyUsLandingPage() {
  const router = useRouter()
  const { selectUser } = useOnlyUsAuthStore()
  const [phase, setPhase] = useState<Phase>('idle')
  const [mouseX, setMouseX] = useState(0)
  const [mouseY, setMouseY] = useState(0)
  const [selectedUser, setSelectedUser] = useState<(typeof STATIC_USERS)[0] | null>(null)
  const [heartBurst, setHeartBurst] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const mouseXRef = useRef(0)
  const mouseYRef = useRef(0)

  // ── 新增：从 Supabase 拉取头像 ──
  const [avatarMap, setAvatarMap] = useState<Record<string, string | null>>({})
  const [avatarsLoaded, setAvatarsLoaded] = useState(false)

  useEffect(() => {
    const fetchAvatars = async () => {
      const supabase = getSupabaseClient()
      const { data, error } = await supabase
        .from('profiles')
        .select('id, avatar_url')
        .in('id', [USER_IDS.user1, USER_IDS.user2])
      if (!error && data) {
        const map: Record<string, string | null> = {}
        data.forEach((p) => { map[p.id] = p.avatar_url })
        setAvatarMap(map)
      }
      setAvatarsLoaded(true)
    }
    fetchAvatars()
  }, [])

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('enter'), 200)
    const t2 = setTimeout(() => setPhase('ready'), 1400)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    const nx = (e.clientX / window.innerWidth - 0.5) * 2
    const ny = (e.clientY / window.innerHeight - 0.5) * 2
    mouseXRef.current = nx
    mouseYRef.current = ny
    setMouseX(nx)
    setMouseY(ny)
  }, [])

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove, { passive: true })
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [handleMouseMove])

  const handleSelectUser = useCallback(
    (userId: string) => {
      if (phase !== 'ready') return
      const user = STATIC_USERS.find((u) => u.id === userId)
      if (!user) return
      setSelectedUser(user)
      setPhase('burst')
      selectUser(userId)
      setTimeout(() => setHeartBurst(true), 50)
    },
    [phase, selectUser]
  )

  const handleBurstComplete = useCallback(() => {
    setPhase('fade')
    setTimeout(() => {
      setPhase('done')
      router.push('/onlyus/home')
    }, 600)
  }, [router])

  const isReady = phase === 'ready'
  const isBursting = phase === 'burst' || phase === 'fade' || phase === 'done'

  return (
    <>
      <style global jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;1,400&family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&display=swap');

        @keyframes fadeInDown {
          from { opacity: 0; transform: translateY(-16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes heartEnter {
          from { opacity: 0; transform: scale(0.65) translateY(12px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes glowBlob {
          0%,100% { transform: translate(-50%,-50%) scale(1); }
          50%      { transform: translate(-50%,-50%) scale(1.18); }
        }
        @keyframes shimmer {
          0%   { background-position: -200px 0; }
          100% { background-position: 200px 0; }
        }
      `}</style>

      <div
        ref={containerRef}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'linear-gradient(160deg, #FDF8F5 0%, #FAF2EE 50%, #F7EEF2 100%)',
          overflow: 'hidden',
          userSelect: 'none',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Background glow blobs */}
        <div style={{
          position: 'absolute', top: '25%', left: '50%',
          width: 700, height: 700, borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(196,120,90,0.10) 0%, rgba(232,132,156,0.07) 40%, transparent 68%)',
          animation: 'glowBlob 14s ease-in-out infinite',
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', top: '70%', left: '35%',
          width: 400, height: 400, borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(232,132,156,0.07) 0%, transparent 70%)',
          animation: 'glowBlob 18s ease-in-out infinite reverse',
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', top: '55%', right: '15%',
          width: 300, height: 300, borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(196,120,90,0.07) 0%, transparent 70%)',
          animation: 'glowBlob 20s ease-in-out infinite',
          transform: 'translate(50%, -50%)',
          pointerEvents: 'none',
        }} />

        <ParticleField />

        {/* === MAIN VERTICAL STACK === */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 0,
          position: 'relative',
          zIndex: 10,
          width: '100%',
          maxWidth: 480,
        }}>

          {/* ── Eyebrow ── */}
          <div style={{
            opacity: isReady ? 1 : 0,
            animation: isReady ? 'fadeInDown 0.8s ease forwards' : 'none',
            textAlign: 'center',
            marginBottom: 6,
          }}>
            <p style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: 11,
              letterSpacing: '0.38em',
              textTransform: 'uppercase',
              color: '#C4785A',
              opacity: 0.75,
              margin: 0,
            }}>
              Just the two of us
            </p>
          </div>

          {/* ── Title ── */}
          <div style={{
            opacity: isReady ? 1 : 0,
            animation: isReady ? 'fadeInDown 0.9s 0.05s ease forwards' : 'none',
            textAlign: 'center',
            marginBottom: 4,
          }}>
            <h1 style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 'clamp(36px, 5.5vw, 54px)',
              fontWeight: 400,
              color: '#2E1810',
              lineHeight: 1.08,
              letterSpacing: '-0.015em',
              margin: 0,
            }}>
              Only Us
            </h1>
          </div>

          {/* ── Subtitle ── */}
          <div style={{
            opacity: isReady ? 1 : 0,
            animation: isReady ? 'fadeIn 1s 0.2s ease forwards' : 'none',
            textAlign: 'center',
            marginBottom: 10,
          }}>
            <p style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontStyle: 'italic',
              fontSize: 15,
              color: '#8B5E52',
              opacity: 0.8,
              margin: 0,
              letterSpacing: '0.04em',
            }}>
              我们的小世界
            </p>
          </div>

          {/* ── Divider ── */}
          <div style={{
            opacity: isReady ? 1 : 0,
            animation: isReady ? 'fadeIn 1s 0.3s ease forwards' : 'none',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            marginBottom: 0,
          }}>
            <div style={{ width: 40, height: 1, background: 'linear-gradient(to right, transparent, rgba(196,120,90,0.4))' }} />
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'rgba(196,120,90,0.5)' }} />
            <div style={{ width: 40, height: 1, background: 'linear-gradient(to left, transparent, rgba(196,120,90,0.4))' }} />
          </div>

          {/* ── 3D Heart ── */}
          <div style={{
            width: 320,
            height: 320,
            position: 'relative',
            transform: `translateX(${mouseX * -5}px) translateY(${mouseY * -3}px)`,
            transition: 'transform 0.15s ease-out',
            opacity: phase === 'idle' ? 0 : 1,
            animation: phase === 'enter' ? 'heartEnter 1.1s cubic-bezier(0.16,1,0.3,1) forwards' : 'none',
            marginTop: -16,
            marginBottom: -12,
          }}>
            {phase !== 'idle' && (
              <HeartCrystal
                burst={heartBurst}
                onBurstComplete={handleBurstComplete}
                mouseX={mouseX}
                mouseY={mouseY}
              />
            )}
          </div>

          {/* ── User select buttons ── */}
          <div style={{
            display: 'flex',
            gap: 56,
            alignItems: 'flex-start',
            opacity: isReady ? 1 : 0,
            animation: isReady ? 'fadeInUp 0.9s 0.4s ease forwards' : 'none',
            pointerEvents: isReady ? 'auto' : 'none',
            marginBottom: 0,
          }}>
            {STATIC_USERS.map((user, i) => (
              // 头像加载前显示骨架，加载后传入真实 avatarUrl
              avatarsLoaded ? (
                <UserSelectButton
                  key={user.id}
                  userId={user.id}
                  nickname={user.nickname}
                  avatarUrl={avatarMap[user.id] ?? undefined}
                  role={user.role}
                  onSelect={handleSelectUser}
                  disabled={isBursting}
                  delay={i * 100}
                />
              ) : (
                // 骨架占位：与 UserSelectButton 尺寸一致
                <div
                  key={user.id}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 14,
                  }}
                >
                  <div style={{
                    width: 88,
                    height: 88,
                    borderRadius: '50%',
                    background: 'linear-gradient(90deg, rgba(196,120,90,0.12) 25%, rgba(196,120,90,0.22) 50%, rgba(196,120,90,0.12) 75%)',
                    backgroundSize: '400px 100%',
                    animation: 'shimmer 1.4s infinite linear',
                  }} />
                  <div style={{
                    width: 48,
                    height: 12,
                    borderRadius: 6,
                    background: 'rgba(196,120,90,0.15)',
                  }} />
                </div>
              )
            ))}
          </div>

          {/* ── Hint ── */}
          <div style={{
            marginTop: 28,
            opacity: isReady ? 0.45 : 0,
            animation: isReady ? 'fadeIn 1.4s 0.9s ease forwards' : 'none',
            pointerEvents: 'none',
          }}>
            <p style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: 10,
              letterSpacing: '0.28em',
              textTransform: 'uppercase',
              color: '#C4785A',
              margin: 0,
            }}>
              Choose who you are
            </p>
          </div>
        </div>

        {/* Side decorative lines */}
        <div style={{
          position: 'absolute', top: '50%', left: '7%',
          width: 1, height: 100,
          background: 'linear-gradient(to bottom, transparent, rgba(196,120,90,0.25), transparent)',
          transform: 'translateY(-50%)',
          opacity: isReady ? 0.7 : 0, transition: 'opacity 1.2s ease 0.6s',
        }} />
        <div style={{
          position: 'absolute', top: '50%', right: '7%',
          width: 1, height: 100,
          background: 'linear-gradient(to bottom, transparent, rgba(232,132,156,0.25), transparent)',
          transform: 'translateY(-50%)',
          opacity: isReady ? 0.7 : 0, transition: 'opacity 1.2s ease 0.6s',
        }} />

        {/* Selected name flash */}
        {selectedUser && (
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 40, textAlign: 'center',
            animation: 'fadeIn 0.4s ease forwards',
            pointerEvents: 'none',
          }}>
            <p style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 20,
              color: '#C4785A',
              letterSpacing: '0.08em',
              margin: 0,
            }}>
              Hi, {selectedUser.nickname} 💛
            </p>
          </div>
        )}

        {/* White overlay transition */}
        <div style={{
          position: 'fixed', inset: 0,
          background: 'linear-gradient(160deg, #FDF8F5 0%, #FAF2EE 100%)',
          zIndex: 100,
          opacity: phase === 'fade' || phase === 'done' ? 1 : 0,
          transition: 'opacity 0.6s ease',
          pointerEvents: phase === 'fade' || phase === 'done' ? 'auto' : 'none',
        }} />
      </div>
    </>
  )
}