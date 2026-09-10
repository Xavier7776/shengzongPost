'use client'

import { useEffect, useState } from 'react'

export default function CompletionCelebration({ onDone }: { onDone: () => void }) {
  const [pieces] = useState(() =>
    Array.from({ length: 40 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 0.5,
      duration: 1.5 + Math.random() * 1.5,
      color: ['#E8849C', '#C4785A', '#6BC5A0', '#D4A847', '#9B8EC4', '#4A90D9'][i % 6],
      size: 6 + Math.random() * 8,
      rotation: Math.random() * 360,
    }))
  )

  useEffect(() => {
    const t = setTimeout(onDone, 3000)
    return () => clearTimeout(t)
  }, [onDone])

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      pointerEvents: 'none',
      overflow: 'hidden',
    }}>
      {pieces.map((p) => (
        <div key={p.id} style={{
          position: 'absolute',
          left: `${p.left}%`,
          top: -20,
          width: p.size, height: p.size * 0.6,
          background: p.color,
          borderRadius: 1,
          transform: `rotate(${p.rotation}deg)`,
          animation: `confetti-fall ${p.duration}s ease-in ${p.delay}s forwards`,
        }} />
      ))}
      <style>{`
        @keyframes confetti-fall {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
      `}</style>

      {/* 中央文字 */}
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        animation: 'celebrate-pop 0.5s cubic-bezier(0.16,1,0.3,1) both',
      }}>
        <div style={{
          background: 'rgba(255,255,255,0.9)',
          backdropFilter: 'blur(20px)',
          borderRadius: 24, padding: '28px 48px',
          boxShadow: '0 12px 40px rgba(196,120,90,0.15)',
          textAlign: 'center',
        }}>
          <span style={{ fontSize: 42, display: 'block', marginBottom: 8 }}>🎉</span>
          <p style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 22, color: '#3D2318', margin: 0,
          }}>心愿达成！</p>
          <p style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: 13, color: 'rgba(196,120,90,0.7)',
            margin: '6px 0 0', fontStyle: 'italic',
          }}>Amazing things happen together</p>
        </div>
      </div>
      <style>{`
        @keyframes celebrate-pop {
          from { transform: scale(0.6); opacity: 0; }
          to   { transform: scale(1);   opacity: 1; }
        }
      `}</style>
    </div>
  )
}
