'use client'

import { useEffect, useState } from 'react'
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
  const [justChecked, setJustChecked] = useState(false)

  useEffect(() => {
    if (!profile?.id || !partner?.id) return
    loadToday(profile.id, partner.id)
    loadStreak(profile.id, partner.id)
    subscribeToPartner(partner.id)
    return () => unsubscribe()
  }, [profile?.id, partner?.id, loadToday, loadStreak, subscribeToPartner, unsubscribe])

  const handleCheckin = async () => {
    if (!profile?.id || myCheckin) return
    await checkin(profile.id)
    setJustChecked(true)
  }

  const myName = profile?.nickname ?? 'Me'
  const partnerName = partner?.nickname ?? 'Ta'

  // 光点装饰
  const rays = Array.from({ length: 6 }, (_, i) => ({
    left: `${15 + i * 13}%`,
    top: `${20 + (i % 3) * 25}%`,
    size: 3 + (i % 3),
    opacity: 0.15 + (i % 3) * 0.08,
    delay: i * 0.35,
  }))

  return (
    <div style={{
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
      {/* 光点装饰 */}
      {bothCheckedIn && rays.map((r, i) => (
        <div key={i} style={{
          position: 'absolute',
          left: r.left, top: r.top,
          width: r.size, height: r.size,
          borderRadius: '50%',
          background: '#F5A623',
          opacity: r.opacity,
          animation: `ray-pulse 2s ease-in-out ${r.delay}s infinite`,
          pointerEvents: 'none',
        }} />
      ))}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <p style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: 11, letterSpacing: '0.3em',
          textTransform: 'uppercase',
          color: bothCheckedIn ? 'rgba(245,166,35,0.8)' : 'rgba(196,120,90,0.7)',
          margin: 0,
        }}>
          早安打卡
        </p>

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
            }}>
              {streak}天
            </span>
          </div>
        )}
      </div>

      {/* 两人状态 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
        {/* 我 */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 44, height: 44, borderRadius: '50%',
            border: `2px solid ${myCheckin ? '#F5A623' : 'rgba(196,120,90,0.2)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: myCheckin ? '#F5A623' : 'rgba(196,120,90,0.3)',
            background: myCheckin ? 'rgba(245,166,35,0.08)' : 'transparent',
            transition: 'all 0.4s ease',
          }}>
            <SunIcon filled={myCheckin} />
          </div>
          <span style={{
            fontSize: 10, letterSpacing: '0.04em',
            color: 'rgba(61,35,24,0.4)',
            fontFamily: "'DM Sans', sans-serif",
          }}>
            {myName}
          </span>
        </div>

        {/* 连线 */}
        <div style={{ flex: 1, position: 'relative', height: 2 }}>
          <div style={{
            height: '100%',
            borderRadius: 2,
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
              transform: 'translate(-50%, -50%)',
              fontSize: 14,
              animation: 'sun-pop 0.4s cubic-bezier(0.16,1,0.3,1)',
            }}>
              ☀️
            </div>
          )}
        </div>

        {/* 对方 */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 44, height: 44, borderRadius: '50%',
            border: `2px solid ${partnerCheckin ? '#C4785A' : 'rgba(196,120,90,0.2)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: partnerCheckin ? '#C4785A' : 'rgba(196,120,90,0.3)',
            background: partnerCheckin ? 'rgba(196,120,90,0.08)' : 'transparent',
            transition: 'all 0.4s ease',
          }}>
            <SunIcon filled={partnerCheckin} />
          </div>
          <span style={{
            fontSize: 10, letterSpacing: '0.04em',
            color: 'rgba(61,35,24,0.4)',
            fontFamily: "'DM Sans', sans-serif",
          }}>
            {partnerName}
          </span>
        </div>
      </div>

      {/* 打卡按钮或状态提示 */}
      {bothCheckedIn ? (
        <div style={{ textAlign: 'center' }}>
          <p style={{
            fontFamily: "'Playfair Display', serif",
            fontStyle: 'italic',
            fontSize: 15, color: '#3D2318',
            margin: '0 0 4px',
          }}>
            早安，新的一天 ☀️
          </p>
          <p style={{
            fontSize: 11, color: 'rgba(61,35,24,0.4)',
            fontFamily: "'Cormorant Garamond', serif",
            letterSpacing: '0.05em', margin: 0,
          }}>
            两人都元气满满
          </p>
        </div>
      ) : myCheckin ? (
        <div style={{
          textAlign: 'center', padding: '8px 0',
          color: 'rgba(61,35,24,0.45)',
          fontFamily: "'Cormorant Garamond', serif",
          fontStyle: 'italic', fontSize: 13,
        }}>
          {justChecked ? '你已打卡 ✓' : '你已打卡'} · 等 {partnerName} 起床
        </div>
      ) : (
        <button
          onClick={handleCheckin}
          disabled={isLoading}
          style={{
            width: '100%', padding: '12px 0',
            borderRadius: 12, border: 'none',
            background: 'linear-gradient(135deg, rgba(245,166,35,0.12), rgba(196,120,90,0.1))',
            color: '#C4785A',
            fontFamily: "'Cormorant Garamond', serif",
            fontStyle: 'italic', fontSize: 15,
            cursor: 'pointer',
            transition: 'all 0.18s ease',
            letterSpacing: '0.02em',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.background = 'linear-gradient(135deg, rgba(245,166,35,0.2), rgba(196,120,90,0.16))'
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.background = 'linear-gradient(135deg, rgba(245,166,35,0.12), rgba(196,120,90,0.1))'
          }}
        >
          早安打卡 ☀️
        </button>
      )}

      <style>{`
        @keyframes ray-pulse {
          0%, 100% { opacity: 0.1; transform: scale(1); }
          50% { opacity: 0.35; transform: scale(1.3); }
        }
        @keyframes sun-pop {
          from { transform: translate(-50%, -50%) scale(0); }
          to { transform: translate(-50%, -50%) scale(1); }
        }
      `}</style>
    </div>
  )
}
