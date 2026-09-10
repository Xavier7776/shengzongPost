'use client'

import { useEffect, useRef, useState } from 'react'
import dayjs from 'dayjs'

interface DaysCounterProps {
  anniversaryDate: string | null | undefined
}

function useCountUp(target: number, duration = 1200) {
  const [value, setValue] = useState(0)
  const rafRef = useRef<number>(0)
  const startRef = useRef<number | null>(null)

  useEffect(() => {
    if (target === 0) return
    const start = () => {
      rafRef.current = requestAnimationFrame((ts) => {
        if (!startRef.current) startRef.current = ts
        const progress = Math.min((ts - startRef.current) / duration, 1)
        // ease out expo
        const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress)
        setValue(Math.round(eased * target))
        if (progress < 1) start()
      })
    }
    startRef.current = null
    start()
    return () => cancelAnimationFrame(rafRef.current)
  }, [target, duration])

  return value
}

export default function DaysCounter({ anniversaryDate }: DaysCounterProps) {
  const days = anniversaryDate
    ? dayjs().diff(dayjs(anniversaryDate), 'day')
    : 0

  const animatedDays = useCountUp(days, 1400)

  const digits = String(animatedDays).padStart(4, ' ').split('')

  return (
    <div style={{
      background: 'rgba(255,255,255,0.55)',
      backdropFilter: 'blur(16px)',
      borderRadius: 20,
      border: '1px solid rgba(196,120,90,0.12)',
      padding: '28px 32px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* 背景装饰 */}
      <div style={{
        position: 'absolute', top: -40, right: -40,
        width: 160, height: 160, borderRadius: '50%',
        background: 'radial-gradient(ellipse, rgba(196,120,90,0.08), transparent 70%)',
        pointerEvents: 'none',
      }} />

      <p style={{
        fontFamily: "'Cormorant Garamond', serif",
        fontSize: 11, letterSpacing: '0.3em',
        textTransform: 'uppercase',
        color: 'rgba(196,120,90,0.7)',
        margin: '0 0 16px',
      }}>
        在一起
      </p>

      {/* 数字显示 */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
        {digits.map((d, i) => (
          <span key={i} style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: d === ' ' ? 0 : 'clamp(52px, 6vw, 72px)',
            fontWeight: 400,
            color: '#3D2318',
            lineHeight: 1,
            transition: 'all 0.05s',
            display: 'inline-block',
            minWidth: d === ' ' ? 0 : '0.6em',
            textAlign: 'center',
          }}>
            {d === ' ' ? '' : d}
          </span>
        ))}
        <span style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: 'clamp(18px, 2vw, 22px)',
          fontStyle: 'italic',
          color: '#C4785A',
          marginLeft: 8,
          opacity: 0.85,
        }}>
          天
        </span>
      </div>

      {anniversaryDate && (
        <p style={{
          marginTop: 10,
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 12, color: 'rgba(61,35,24,0.4)',
          letterSpacing: '0.02em',
        }}>
          {dayjs(anniversaryDate).format('YYYY · MM · DD')} 相遇
        </p>
      )}

      {!anniversaryDate && (
        <p style={{
          marginTop: 10, fontSize: 12,
          color: 'rgba(61,35,24,0.35)',
          fontFamily: "'DM Sans', sans-serif",
        }}>
          在设置中填写纪念日
        </p>
      )}
    </div>
  )
}
