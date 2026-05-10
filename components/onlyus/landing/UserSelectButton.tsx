'use client'

import { useState } from 'react'

interface UserSelectButtonProps {
  userId: string
  nickname: string
  avatarUrl?: string
  role: 'me' | 'partner'
  onSelect: (userId: string) => void
  disabled?: boolean
  delay?: number
}

export default function UserSelectButton({
  userId,
  nickname,
  avatarUrl,
  role,
  onSelect,
  disabled = false,
  delay = 0,
}: UserSelectButtonProps) {
  const [pressing, setPressing] = useState(false)
  const [hovered, setHovered] = useState(false)
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([])

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const id = Date.now()
    setRipples((prev) => [...prev, { id, x, y }])
    setTimeout(() => setRipples((prev) => prev.filter((r) => r.id !== id)), 800)
    setPressing(true)
    setTimeout(() => {
      setPressing(false)
      onSelect(userId)
    }, 300)
  }

  const isMe = role === 'me'
  const accentColor = isMe ? '#C4785A' : '#E8849C'
  const glowColor = isMe ? 'rgba(196,120,90,0.35)' : 'rgba(232,132,156,0.35)'
  const bgGradient = isMe
    ? 'linear-gradient(135deg, rgba(196,120,90,0.18), rgba(196,120,90,0.06))'
    : 'linear-gradient(135deg, rgba(232,132,156,0.18), rgba(232,132,156,0.06))'

  const avatarScale = pressing ? 0.91 : hovered ? 1.06 : 1

  return (
    <button
      onClick={handleClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      disabled={disabled}
      style={{
        animationDelay: `${delay}ms`,
        background: 'none',
        border: 'none',
        padding: 0,
        cursor: disabled ? 'default' : 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 14,
      }}
    >
      {/* Avatar container */}
      <div style={{ position: 'relative' }}>
        {/* Outer glow ring */}
        <div
          style={{
            position: 'absolute',
            inset: -8,
            borderRadius: '50%',
            background: `radial-gradient(ellipse, ${glowColor} 0%, transparent 70%)`,
            opacity: hovered ? 1 : 0.5,
            transition: 'opacity 0.3s ease',
            pointerEvents: 'none',
          }}
        />

        {/* Animated ring */}
        <div
          style={{
            position: 'absolute',
            inset: -3,
            borderRadius: '50%',
            border: `1.5px solid ${accentColor}`,
            opacity: hovered ? 0.8 : 0.3,
            transform: hovered ? 'scale(1.08)' : 'scale(1)',
            transition: 'all 0.35s cubic-bezier(0.34,1.56,0.64,1)',
            pointerEvents: 'none',
          }}
        />

        {/* Avatar circle */}
        <div
          style={{
            width: 88,
            height: 88,
            borderRadius: '50%',
            border: `2.5px solid ${accentColor}`,
            background: bgGradient,
            boxShadow: hovered
              ? `0 12px 40px ${glowColor}, 0 0 0 4px ${accentColor}20, inset 0 1px 0 rgba(255,255,255,0.5)`
              : `0 6px 24px ${glowColor}, inset 0 1px 0 rgba(255,255,255,0.3)`,
            overflow: 'hidden',
            position: 'relative',
            transform: `scale(${avatarScale})`,
            transition: 'all 0.25s cubic-bezier(0.34,1.56,0.64,1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt={nickname} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <span
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 28,
                fontWeight: 500,
                color: accentColor,
                lineHeight: 1,
              }}
            >
              {nickname.charAt(0).toUpperCase()}
            </span>
          )}

          {/* Glass highlight */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, rgba(255,255,255,0.3) 0%, transparent 55%)',
              pointerEvents: 'none',
            }}
          />
        </div>

        {/* Ripples */}
        {ripples.map((r) => (
          <span
            key={r.id}
            style={{
              position: 'absolute',
              left: r.x - 44,
              top: r.y - 44,
              width: 88,
              height: 88,
              borderRadius: '50%',
              background: `radial-gradient(circle, ${accentColor}50, transparent 70%)`,
              animation: 'ripple-out 0.8s ease-out forwards',
              pointerEvents: 'none',
            }}
          />
        ))}
      </div>

      {/* Label */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
        <span
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 15,
            fontWeight: 500,
            color: '#3D2318',
            letterSpacing: '0.03em',
          }}
        >
          {nickname}
        </span>
        <span
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: 10,
            textTransform: 'uppercase',
            letterSpacing: '0.22em',
            color: accentColor,
            opacity: 0.75,
          }}
        >
          {isMe ? "That's me" : 'My love'}
        </span>
      </div>

      <style jsx>{`
        @keyframes ripple-out {
          0% { transform: scale(0.2); opacity: 1; }
          100% { transform: scale(2.8); opacity: 0; }
        }
      `}</style>
    </button>
  )
}
