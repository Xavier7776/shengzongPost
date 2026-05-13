'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useOnlyUsAuthStore } from '@/stores/onlyus/authStore'
import { useMorningStore } from '@/stores/onlyus/utilStores'

function SunIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <circle cx="12" cy="12" r="5" />
      {filled ? (
        <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
      ) : (
        <>
          <line x1="12" y1="1" x2="12" y2="3" />
          <line x1="12" y1="21" x2="12" y2="23" />
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
          <line x1="1" y1="12" x2="3" y2="12" />
          <line x1="21" y1="12" x2="23" y2="12" />
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </>
      )}
    </svg>
  )
}

export default function MorningCard() {
  const { profile, partner } = useOnlyUsAuthStore()
  const {
    myCheckin, partnerCheckin, bothCheckedIn, streak,
    isLoading, loadToday, loadStreak, checkin, subscribeToPartner, unsubscribe,
  } = useMorningStore()
  const [showPopup, setShowPopup] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [checking, setChecking] = useState(false)
  const [particles, setParticles] = useState<{ id: number; x: number; y: number; vx: number; vy: number; emoji: string }[]>([])
  const particleId = useRef(0)
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!profile?.id || !partner?.id) return
    loadToday(profile.id, partner.id)
    loadStreak(profile.id, partner.id)
    subscribeToPartner(partner.id)
    return () => unsubscribe()
  }, [profile?.id, partner?.id, loadToday, loadStreak, subscribeToPartner, unsubscribe])

  const spawnParticles = useCallback(() => {
    const emojis = ['☀️', '✨', '💛', '🌟', '🌅']
    const card = cardRef.current
    if (!card) return
    const rect = card.getBoundingClientRect()
    const cx = rect.width / 2
    const cy = rect.height / 2
    const ps = Array.from({ length: 14 }, () => ({
      id: particleId.current++,
      x: cx, y: cy,
      vx: (Math.random() - 0.5) * 10,
      vy: (Math.random() - 0.5) * 10 - 3,
      emoji: emojis[Math.floor(Math.random() * emojis.length)],
    }))
    setParticles(ps)
    setTimeout(() => setParticles([]), 1200)
  }, [])

  const handleCheckin = async () => {
    if (!profile?.id || myCheckin || checking) return
    setErrorMsg('')
    setChecking(true)
    try {
      await checkin(profile.id)
      spawnParticles()
      setShowPopup(true)
      setTimeout(() => setShowPopup(false), 2500)
    } catch (err: any) {
      setErrorMsg(err?.message || '打卡失败，请重试')
      setTimeout(() => setErrorMsg(''), 3000)
    } finally {
      setChecking(false)
    }
  }

  const myName = profile?.nickname ?? 'Me'
  const partnerName = partner?.nickname ?? 'Ta'

  const rays = Array.from({ length: 6 }, (_, i) => ({
    left: `${15 + i * 13}%`,
    top: `${20 + (i % 3) * 25}%`,
    size: 3 + (i % 3),
    opacity: 0.15 + (i % 3) * 0.08,
    delay: i * 0.35,
  }))

  return (
    <>
      <style>{`
        @keyframes ray-pulse {
          0%, 100% { opacity: 0.1; transform: scale(1); }
          50% { opacity: 0.35; transform: scale(1.3); }
        }
        @keyframes sun-pop {
          from { transform: translate(-50%, -50%) scale(0); }
          to { transform: translate(-50%, -50%) scale(1); }
        }
        @keyframes morning-popup-in {
          0% { opacity: 0; transform: translate(-50%, -50%) scale(0.5); }
          60% { transform: translate(-50%, -50%) scale(1.08); }
          100% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }
        @keyframes morning-overlay-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes morning-particle {
          0% { opacity: 1; transform: translate(0, 0) scale(1); }
          100% { opacity: 0; transform: translate(var(--px), var(--py)) scale(0.3); }
        }
        @keyframes btn-press {
          0% { transform: scale(1); }
          50% { transform: scale(0.92); }
          100% { transform: scale(1); }
        }
      `}</style>

      <div ref={cardRef} style={{
        background: bothCheckedIn
          ? 'linear-gradient(135deg, rgba(245,166,35,0.12), rgba(196,120,90,0.1))'
          : 'rgba(255,255,255,0.55)',
        backdropFilter: 'blur(16px)',
        borderRadius: 20,
        border: bothCheckedIn
          ? '1px solid rgba(245,166,35,0.25)'
          : '1px solid rgba(196,120,90,0.1)',
        padding: '24px 28px',
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.6s ease',
      }}>
        {/* Particles */}
        {particles.map(p => (
          <div key={p.id} style={{
            position: 'absolute', left: p.x, top: p.y,
            fontSize: 16 + Math.random() * 8, pointerEvents: 'none', zIndex: 20,
            ['--px' as string]: `${p.vx * 20}px`,
            ['--py' as string]: `${p.vy * 20 - 20}px`,
            animation: 'morning-particle 1s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards',
          }}>
            {p.emoji}
          </div>
        ))}

        {bothCheckedIn && rays.map((r, i) => (
          <div key={i} style={{
            position: 'absolute', left: r.left, top: r.top,
            width: r.size, height: r.size,
            borderRadius: '50%', background: '#F5A623',
            opacity: r.opacity,
            animation: `ray-pulse 2s ease-in-out ${r.delay}s infinite`,
            pointerEvents: 'none',
          }} />
        ))}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <p style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: 11, letterSpacing: '0.3em', textTransform: 'uppercase',
            color: bothCheckedIn ? 'rgba(245,166,35,0.8)' : 'rgba(196,120,90,0.7)', margin: 0,
          }}>早安打卡</p>
          {streak > 0 && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 4,
              background: bothCheckedIn ? 'rgba(245,166,35,0.15)' : 'rgba(196,120,90,0.08)',
              border: `1px solid ${bothCheckedIn ? 'rgba(245,166,35,0.3)' : 'rgba(196,120,90,0.15)'}`,
              borderRadius: 20, padding: '3px 10px',
            }}>
              <span style={{ fontSize: 12 }}>🔥</span>
              <span style={{
                fontSize: 11, fontWeight: 600,
                color: bothCheckedIn ? '#F5A623' : '#C4785A',
                fontFamily: "'DM Sans', sans-serif",
              }}>{streak}天</span>
            </div>
          )}
        </div>

        {/* Two avatars */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 44, height: 44, borderRadius: '50%',
              border: `2px solid ${myCheckin ? '#F5A623' : 'rgba(196,120,90,0.2)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: myCheckin ? '#F5A623' : 'rgba(196,120,90,0.3)',
              background: myCheckin ? 'rgba(245,166,35,0.08)' : 'transparent',
              transition: 'all 0.4s ease',
            }}><SunIcon filled={myCheckin} /></div>
            <span style={{ fontSize: 10, color: 'rgba(61,35,24,0.4)', fontFamily: "'DM Sans', sans-serif" }}>{myName}</span>
          </div>

          <div style={{ flex: 1, position: 'relative', height: 2 }}>
            <div style={{
              height: '100%', borderRadius: 2,
              background: bothCheckedIn
                ? 'linear-gradient(to right, #F5A623, #C4785A)'
                : partnerCheckin || myCheckin
                  ? `linear-gradient(to right, ${myCheckin ? '#F5A623' : 'rgba(196,120,90,0.15)'}, ${partnerCheckin ? '#C4785A' : 'rgba(196,120,90,0.15)'})`
                  : 'rgba(196,120,90,0.1)',
              transition: 'background 0.6s ease',
            }} />
            {bothCheckedIn && (
              <div style={{
                position: 'absolute', top: '50%', left: '50%',
                transform: 'translate(-50%, -50%)', fontSize: 14,
                animation: 'sun-pop 0.4s cubic-bezier(0.16,1,0.3,1)',
              }}>☀️</div>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 44, height: 44, borderRadius: '50%',
              border: `2px solid ${partnerCheckin ? '#C4785A' : 'rgba(196,120,90,0.2)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: partnerCheckin ? '#C4785A' : 'rgba(196,120,90,0.3)',
              background: partnerCheckin ? 'rgba(196,120,90,0.08)' : 'transparent',
              transition: 'all 0.4s ease',
            }}><SunIcon filled={partnerCheckin} /></div>
            <span style={{ fontSize: 10, color: 'rgba(61,35,24,0.4)', fontFamily: "'DM Sans', sans-serif" }}>{partnerName}</span>
          </div>
        </div>

        {/* Error message */}
        {errorMsg && (
          <p style={{
            textAlign: 'center', fontSize: 12, color: 'rgba(180,60,60,0.8)',
            fontFamily: "'DM Sans', sans-serif", margin: '0 0 10px',
          }}>{errorMsg}</p>
        )}

        {/* Button or status */}
        {bothCheckedIn ? (
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontFamily: "'Playfair Display', serif", fontStyle: 'italic', fontSize: 15, color: '#3D2318', margin: '0 0 4px' }}>
              早安，新的一天 ☀️
            </p>
            <p style={{ fontSize: 11, color: 'rgba(61,35,24,0.4)', fontFamily: "'Cormorant Garamond', serif", margin: 0 }}>
              两人都元气满满
            </p>
          </div>
        ) : myCheckin ? (
          <div style={{
            textAlign: 'center', padding: '8px 0',
            color: 'rgba(61,35,24,0.45)',
            fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: 13,
          }}>
            你已打卡 ✓ · 等 {partnerName} 起床
          </div>
        ) : (
          <button
            onClick={handleCheckin}
            disabled={checking}
            style={{
              width: '100%', padding: '14px 0',
              borderRadius: 14, border: 'none',
              background: checking
                ? 'rgba(196,120,90,0.08)'
                : 'linear-gradient(135deg, rgba(245,166,35,0.15), rgba(196,120,90,0.12))',
              color: '#C4785A',
              fontFamily: "'Cormorant Garamond', serif",
              fontStyle: 'italic', fontSize: 16,
              cursor: checking ? 'wait' : 'pointer',
              transition: 'all 0.15s ease',
              letterSpacing: '0.02em',
            }}
          >
            {checking ? '打卡中...' : '早安打卡 ☀️'}
          </button>
        )}
      </div>

      {/* Success popup */}
      {showPopup && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 400,
          background: 'rgba(61,35,24,0.2)',
          backdropFilter: 'blur(4px)',
          animation: 'morning-overlay-in 0.2s ease',
        }} onClick={() => setShowPopup(false)}>
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            animation: 'morning-popup-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
            width: '80%', maxWidth: 300,
            background: 'linear-gradient(145deg, rgba(255,255,255,0.95), rgba(255,248,240,0.98))',
            backdropFilter: 'blur(20px)',
            borderRadius: 24,
            border: '1px solid rgba(245,166,35,0.25)',
            padding: '36px 28px 28px',
            textAlign: 'center',
            boxShadow: '0 24px 60px rgba(245,166,35,0.15)',
          }} onClick={e => e.stopPropagation()}>
            <div style={{
              position: 'absolute', top: -20, left: '50%', transform: 'translateX(-50%)',
              width: 100, height: 100, borderRadius: '50%',
              background: 'radial-gradient(ellipse, rgba(245,166,35,0.15), transparent 70%)',
              pointerEvents: 'none',
            }} />
            <div style={{ fontSize: 52, marginBottom: 12 }}>☀️</div>
            <h2 style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 22, fontWeight: 400, color: '#3D2318', margin: '0 0 8px',
            }}>早安打卡成功</h2>
            <p style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: 14, fontStyle: 'italic',
              color: 'rgba(196,120,90,0.7)', margin: '0 0 16px', lineHeight: 1.5,
            }}>
              {partnerCheckin ? '两人都元气满满，新的一天开始啦！' : `等 ${partnerName} 一起开始新的一天~`}
            </p>
            {streak > 0 && (
              <div style={{
                display: 'inline-block', background: 'rgba(245,166,35,0.1)',
                border: '1px solid rgba(245,166,35,0.2)', borderRadius: 20, padding: '6px 18px', marginBottom: 12,
              }}>
                <span style={{ fontSize: 13, fontFamily: "'DM Sans', sans-serif", color: '#D4A05E' }}>
                  🔥 连续 {streak + 1} 天
                </span>
              </div>
            )}
            <p style={{ margin: '12px 0 0', fontSize: 10, color: 'rgba(61,35,24,0.2)', fontFamily: "'DM Sans', sans-serif" }}>
              点击空白处关闭
            </p>
          </div>
        </div>
      )}
    </>
  )
}
