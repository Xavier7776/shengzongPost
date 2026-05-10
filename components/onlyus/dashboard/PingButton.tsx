'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useOnlyUsAuthStore } from '@/stores/onlyus/authStore'
import { usePingStore } from '@/stores/onlyus/utilStores'

interface Particle {
  id: number
  x: number
  y: number
  vx: number
  vy: number
  size: number
  color: string
  life: number
  maxLife: number
}

const COLORS = ['#C4785A', '#E8849C', '#D4956B', '#F0A0B4', '#C4785A']

export default function PingButton() {
  const { profile, partner } = useOnlyUsAuthStore()
  const { lastPingAt, incomingPing, sendPing, subscribeToIncoming, clearIncoming, unsubscribe } = usePingStore()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<Particle[]>([])
  const rafRef = useRef<number>(0)
  const pidRef = useRef(0)
  const [cooldown, setCooldown] = useState(0) // 秒
  const [showIncoming, setShowIncoming] = useState(false)

  // 冷却计时器
  useEffect(() => {
    if (!lastPingAt) return
    const elapsed = Date.now() - lastPingAt
    const remaining = Math.max(0, 30 - Math.floor(elapsed / 1000))
    setCooldown(remaining)
    if (remaining === 0) return
    const interval = setInterval(() => {
      const e = Date.now() - lastPingAt!
      const r = Math.max(0, 30 - Math.floor(e / 1000))
      setCooldown(r)
      if (r === 0) clearInterval(interval)
    }, 1000)
    return () => clearInterval(interval)
  }, [lastPingAt])

  // 订阅对方 ping
  useEffect(() => {
    if (profile?.id) subscribeToIncoming(profile.id)
    return () => unsubscribe()
  }, [profile?.id, subscribeToIncoming, unsubscribe])

  // 收到 ping 时触发动画
  useEffect(() => {
    if (!incomingPing) return
    setShowIncoming(true)
    burstParticles(true)
    const t = setTimeout(() => { setShowIncoming(false); clearIncoming() }, 2500)
    return () => clearTimeout(t)
  }, [incomingPing, clearIncoming])

  // Canvas 粒子动画
  const burstParticles = useCallback((incoming = false) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const cx = rect.width / 2
    const cy = rect.height / 2

    const count = incoming ? 40 : 28
    for (let i = 0; i < count; i++) {
      const angle = (Math.random() * Math.PI * 2)
      const speed = incoming ? (2 + Math.random() * 5) : (1.5 + Math.random() * 3.5)
      particlesRef.current.push({
        id: pidRef.current++,
        x: cx, y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - (incoming ? 1 : 0.5),
        size: 2 + Math.random() * (incoming ? 5 : 3),
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        life: 1,
        maxLife: 0.6 + Math.random() * 0.5,
      })
    }
  }, [])

  // 粒子渲染循环
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      particlesRef.current = particlesRef.current.filter(p => p.life > 0)

      for (const p of particlesRef.current) {
        p.x += p.vx
        p.y += p.vy
        p.vy += 0.12 // gravity
        p.vx *= 0.97
        p.life -= 0.016 / p.maxLife

        ctx.save()
        ctx.globalAlpha = Math.max(0, p.life) * 0.9
        ctx.fillStyle = p.color
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      }

      rafRef.current = requestAnimationFrame(render)
    }

    rafRef.current = requestAnimationFrame(render)
    return () => cancelAnimationFrame(rafRef.current)
  }, [])

  const handlePing = () => {
    if (cooldown > 0 || !profile?.id || !partner?.id) return
    sendPing(profile.id, partner.id)
    burstParticles(false)
  }

  const canPing = cooldown === 0 && !!profile?.id && !!partner?.id
  const partnerName = partner?.nickname ?? '对方'

  return (
    <div style={{
      background: 'rgba(255,255,255,0.55)',
      backdropFilter: 'blur(16px)',
      borderRadius: 20,
      border: '1px solid rgba(196,120,90,0.1)',
      padding: '24px 28px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <p style={{
        fontFamily: "'Cormorant Garamond', serif",
        fontSize: 11, letterSpacing: '0.3em',
        textTransform: 'uppercase',
        color: 'rgba(196,120,90,0.7)',
        margin: '0 0 16px',
      }}>
        戳一戳
      </p>

      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        {/* 按钮 + Canvas */}
        <div style={{ position: 'relative', width: 88, height: 88, flexShrink: 0 }}>
          <canvas
            ref={canvasRef}
            width={200}
            height={200}
            style={{
              position: 'absolute',
              top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              pointerEvents: 'none',
              zIndex: 10,
            }}
          />

          <button
            onClick={handlePing}
            disabled={!canPing}
            style={{
              width: 88, height: 88, borderRadius: '50%',
              border: 'none', cursor: canPing ? 'pointer' : 'not-allowed',
              background: canPing
                ? 'linear-gradient(135deg, #C4785A, #E8849C)'
                : 'rgba(196,120,90,0.15)',
              boxShadow: canPing ? '0 4px 20px rgba(196,120,90,0.3)' : 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.2s ease',
              transform: 'scale(1)',
              position: 'relative',
            }}
            onMouseDown={e => { if (canPing) (e.currentTarget as HTMLElement).style.transform = 'scale(0.92)' }}
            onMouseUp={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)' }}
          >
            {/* 脉冲圆环（idle状态时） */}
            {canPing && (
              <div style={{
                position: 'absolute', inset: -4,
                borderRadius: '50%',
                border: '1px solid rgba(196,120,90,0.3)',
                animation: 'ping-pulse 2s ease-in-out infinite',
              }} />
            )}
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 20.5C12 20.5 2 13.5 2 7.5C2 4.46 4.46 2 7.5 2C9.24 2 10.91 2.81 12 4.08C13.09 2.81 14.76 2 16.5 2C19.54 2 22 4.46 22 7.5C22 13.5 12 20.5 12 20.5Z"
                fill={canPing ? 'rgba(255,255,255,0.9)' : 'rgba(196,120,90,0.4)'}
              />
            </svg>
          </button>
        </div>

        {/* 状态文字 */}
        <div>
          {showIncoming ? (
            <div style={{ animation: 'fade-in-up 0.3s ease' }}>
              <p style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 16, color: '#E8849C',
                margin: '0 0 4px',
              }}>
                {partnerName} 戳了你！💕
              </p>
              <p style={{ fontSize: 11, color: 'rgba(61,35,24,0.4)', fontFamily: "'DM Sans', sans-serif", margin: 0 }}>
                快去回应 ta 吧
              </p>
            </div>
          ) : cooldown > 0 ? (
            <div>
              <p style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 13, color: 'rgba(61,35,24,0.5)',
                margin: '0 0 4px',
              }}>
                已发送
              </p>
              <p style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontStyle: 'italic',
                fontSize: 12, color: 'rgba(196,120,90,0.6)',
                margin: 0,
              }}>
                {cooldown}s 后可再次发送
              </p>
            </div>
          ) : (
            <div>
              <p style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 13, color: 'rgba(61,35,24,0.6)',
                margin: '0 0 4px',
              }}>
                戳一戳 {partnerName}
              </p>
              <p style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontStyle: 'italic',
                fontSize: 12, color: 'rgba(61,35,24,0.35)',
                margin: 0,
              }}>
                让 ta 知道你在想 ta
              </p>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes ping-pulse {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.15); opacity: 0; }
        }
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
