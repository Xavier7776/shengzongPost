'use client'

import { useEffect, useState } from 'react'
import { useOnlyUsAuthStore } from '@/stores/onlyus/authStore'
import { useGoodnightStore } from '@/stores/onlyus/utilStores'

function MoonIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <path d="M21 12.79A9 9 0 1111.21 3a7 7 0 009.79 9.79z"/>
    </svg>
  )
}

export default function GoodnightCard() {
  const { profile, partner } = useOnlyUsAuthStore()
  const {
    myCheckin, partnerCheckin, bothCheckedIn, streak,
    isLoading, loadToday, loadStreak, checkin, subscribeToPartner, unsubscribe,
  } = useGoodnightStore()
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

  // 星星点点背景装饰
  const stars = Array.from({ length: 6 }, (_, i) => ({
    left: `${15 + i * 13}%`,
    top: `${20 + (i % 3) * 25}%`,
    size: 2 + (i % 3),
    opacity: 0.2 + (i % 3) * 0.1,
    delay: i * 0.4,
  }))

  return (
    <div style={{
      background: bothCheckedIn
        ? 'linear-gradient(135deg, rgba(61,35,24,0.92), rgba(80,30,50,0.88))'
        : 'rgba(255,255,255,0.55)',
      backdropFilter: 'blur(16px)',
      borderRadius: 20,
      border: bothCheckedIn
        ? '1px solid rgba(232,132,156,0.25)'
        : '1px solid rgba(196,120,90,0.1)',
      padding: '24px 28px',
      position: 'relative',
      overflow: 'hidden',
      transition: 'all 0.6s ease',
    }}>
      {/* 星星装饰（晚安状态下显示）*/}
      {bothCheckedIn && stars.map((s, i) => (
        <div key={i} style={{
          position: 'absolute',
          left: s.left, top: s.top,
          width: s.size, height: s.size,
          borderRadius: '50%',
          background: '#F8F6F3',
          opacity: s.opacity,
          animation: `star-twinkle 2s ease-in-out ${s.delay}s infinite`,
          pointerEvents: 'none',
        }} />
      ))}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <p style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: 11, letterSpacing: '0.3em',
          textTransform: 'uppercase',
          color: bothCheckedIn ? 'rgba(232,132,156,0.7)' : 'rgba(196,120,90,0.7)',
          margin: 0,
        }}>
          晚安打卡
        </p>

        {streak > 0 && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 4,
            background: bothCheckedIn ? 'rgba(232,132,156,0.15)' : 'rgba(196,120,90,0.08)',
            border: `1px solid ${bothCheckedIn ? 'rgba(232,132,156,0.3)' : 'rgba(196,120,90,0.15)'}`,
            borderRadius: 20, padding: '3px 10px',
          }}>
            <span style={{ fontSize: 12 }}>🔥</span>
            <span style={{
              fontSize: 11, fontWeight: 600,
              color: bothCheckedIn ? '#E8849C' : '#C4785A',
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
            border: `2px solid ${myCheckin ? '#C4785A' : 'rgba(196,120,90,0.2)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: myCheckin ? '#C4785A' : 'rgba(196,120,90,0.3)',
            background: myCheckin ? 'rgba(196,120,90,0.08)' : 'transparent',
            transition: 'all 0.4s ease',
          }}>
            <MoonIcon filled={myCheckin} />
          </div>
          <span style={{
            fontSize: 10, letterSpacing: '0.04em',
            color: bothCheckedIn ? 'rgba(248,246,243,0.5)' : 'rgba(61,35,24,0.4)',
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
              ? 'linear-gradient(to right, #C4785A, #E8849C)'
              : partnerCheckin || myCheckin
                ? `linear-gradient(to right, ${myCheckin ? '#C4785A' : 'rgba(196,120,90,0.15)'}, ${partnerCheckin ? '#E8849C' : 'rgba(232,132,156,0.15)'})`
                : 'rgba(196,120,90,0.1)',
            transition: 'background 0.6s ease',
          }} />
          {bothCheckedIn && (
            <div style={{
              position: 'absolute', top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              fontSize: 14,
              animation: 'heart-pop 0.4s cubic-bezier(0.16,1,0.3,1)',
            }}>
              💕
            </div>
          )}
        </div>

        {/* 对方 */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 44, height: 44, borderRadius: '50%',
            border: `2px solid ${partnerCheckin ? '#E8849C' : 'rgba(232,132,156,0.2)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: partnerCheckin ? '#E8849C' : 'rgba(232,132,156,0.3)',
            background: partnerCheckin ? 'rgba(232,132,156,0.08)' : 'transparent',
            transition: 'all 0.4s ease',
          }}>
            <MoonIcon filled={partnerCheckin} />
          </div>
          <span style={{
            fontSize: 10, letterSpacing: '0.04em',
            color: bothCheckedIn ? 'rgba(248,246,243,0.5)' : 'rgba(61,35,24,0.4)',
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
            fontSize: 15, color: 'rgba(248,246,243,0.85)',
            margin: '0 0 4px',
          }}>
            晚安，好梦 ✨
          </p>
          <p style={{
            fontSize: 11, color: 'rgba(248,246,243,0.35)',
            fontFamily: "'Cormorant Garamond', serif",
            letterSpacing: '0.05em', margin: 0,
          }}>
            两颗心都安心了
          </p>
        </div>
      ) : myCheckin ? (
        <div style={{
          textAlign: 'center', padding: '8px 0',
          color: bothCheckedIn ? 'rgba(248,246,243,0.6)' : 'rgba(61,35,24,0.45)',
          fontFamily: "'Cormorant Garamond', serif",
          fontStyle: 'italic', fontSize: 13,
        }}>
          {justChecked ? '你已打卡 ✓' : '你已打卡'} · 等 {partnerName} 回应
        </div>
      ) : (
        <button
          onClick={handleCheckin}
          disabled={isLoading}
          style={{
            width: '100%', padding: '12px 0',
            borderRadius: 12, border: 'none',
            background: 'linear-gradient(135deg, rgba(196,120,90,0.15), rgba(232,132,156,0.1))',
            borderTop: '1px solid rgba(196,120,90,0.15)',
            color: '#C4785A',
            fontFamily: "'Cormorant Garamond', serif",
            fontStyle: 'italic', fontSize: 15,
            cursor: 'pointer',
            transition: 'all 0.18s ease',
            letterSpacing: '0.02em',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.background = 'linear-gradient(135deg, rgba(196,120,90,0.22), rgba(232,132,156,0.16))'
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.background = 'linear-gradient(135deg, rgba(196,120,90,0.15), rgba(232,132,156,0.1))'
          }}
        >
          晚安打卡 🌙
        </button>
      )}

      <style>{`
        @keyframes star-twinkle {
          0%, 100% { opacity: 0.15; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.4); }
        }
        @keyframes heart-pop {
          from { transform: translate(-50%, -50%) scale(0); }
          to { transform: translate(-50%, -50%) scale(1); }
        }
      `}</style>
    </div>
  )
}
