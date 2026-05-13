'use client'

import type { Medal, UserMedal } from '@/stores/onlyus/medalStore'

interface Props {
  medal: Medal
  unlocked: boolean
  unlockedAt?: string
  onClick?: () => void
}

export default function MedalCard({ medal, unlocked, unlockedAt, onClick }: Props) {
  return (
    <div
      onClick={onClick}
      style={{
      background: unlocked
        ? 'rgba(255,255,255,0.65)'
        : 'rgba(255,255,255,0.3)',
      backdropFilter: 'blur(12px)',
      borderRadius: 14,
      border: unlocked
        ? '1px solid rgba(196,120,90,0.15)'
        : '1px solid rgba(196,120,90,0.06)',
      padding: '16px 14px',
      textAlign: 'center',
      position: 'relative',
      overflow: 'hidden',
      transition: 'transform 0.2s, box-shadow 0.2s',
      cursor: 'pointer',
    }}
    onMouseEnter={(e) => {
      if (unlocked) {
        e.currentTarget.style.transform = 'translateY(-2px)'
        e.currentTarget.style.boxShadow = '0 6px 20px rgba(196,120,90,0.1)'
      }
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'translateY(0)'
      e.currentTarget.style.boxShadow = 'none'
    }}
    >
      {/* 解锁光晕 */}
      {unlocked && (
        <div style={{
          position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)',
          width: 60, height: 60, borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(196,120,90,0.12), transparent 70%)',
          pointerEvents: 'none',
        }} />
      )}

      <span style={{
        fontSize: 28, display: 'block', marginBottom: 8,
        filter: unlocked ? 'none' : 'grayscale(1) opacity(0.3)',
      }}>{medal.emoji}</span>

      <h4 style={{
        margin: '0 0 4px', fontSize: 12, fontWeight: 500,
        fontFamily: "'DM Sans', sans-serif",
        color: unlocked ? '#3D2318' : 'rgba(61,35,24,0.3)',
      }}>{medal.title}</h4>

      <p style={{
        margin: 0, fontSize: 10,
        fontFamily: "'Cormorant Garamond', serif",
        color: unlocked ? 'rgba(196,120,90,0.6)' : 'rgba(61,35,24,0.2)',
        lineHeight: 1.3,
      }}>{medal.description}</p>

      {!unlocked && (
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(248,246,243,0.5)',
        }}>
          <span style={{ fontSize: 16, opacity: 0.3 }}>🔒</span>
        </div>
      )}

      {unlocked && unlockedAt && (
        <p style={{
          margin: '6px 0 0', fontSize: 9,
          color: 'rgba(107,197,160,0.7)',
          fontFamily: "'DM Sans', sans-serif",
        }}>
          {new Date(unlockedAt).toLocaleDateString('zh-CN')}
        </p>
      )}
    </div>
  )
}
