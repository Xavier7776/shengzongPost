'use client'

import { useEffect, useState, useRef } from 'react'

function useCountUp(target: number, duration = 800) {
  const [value, setValue] = useState(0)
  const rafRef = useRef<number>(0)
  const startRef = useRef<number | null>(null)

  useEffect(() => {
    if (target === 0) { setValue(0); return }
    startRef.current = null
    const tick = () => {
      rafRef.current = requestAnimationFrame((ts) => {
        if (!startRef.current) startRef.current = ts
        const progress = Math.min((ts - startRef.current) / duration, 1)
        const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress)
        setValue(Math.round(eased * target))
        if (progress < 1) tick()
      })
    }
    tick()
    return () => cancelAnimationFrame(rafRef.current)
  }, [target, duration])
  return value
}

interface Props { total: number; completed: number }

export default function BucketStats({ total, completed }: Props) {
  const rate = total > 0 ? Math.round((completed / total) * 100) : 0
  const animTotal = useCountUp(total)
  const animCompleted = useCountUp(completed)
  const animRate = useCountUp(rate)

  return (
    <div style={{
      display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12,
    }}>
      {[
        { label: '心愿总数', value: animTotal, color: '#C4785A' },
        { label: '已完成', value: animCompleted, color: '#6BC5A0' },
        { label: '完成率', value: animRate, suffix: '%', color: '#E8849C' },
      ].map(({ label, value, color, suffix }) => (
        <div key={label} style={{
          background: 'rgba(255,255,255,0.55)',
          backdropFilter: 'blur(16px)',
          borderRadius: 14,
          border: '1px solid rgba(196,120,90,0.1)',
          padding: '14px 12px',
          textAlign: 'center',
        }}>
          <p style={{
            margin: '0 0 4px', fontSize: 10,
            fontFamily: "'Cormorant Garamond', serif",
            letterSpacing: '0.15em', textTransform: 'uppercase',
            color: 'rgba(196,120,90,0.6)',
          }}>{label}</p>
          <span style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 28, fontWeight: 400, color, lineHeight: 1,
          }}>{value}{suffix || ''}</span>
        </div>
      ))}
    </div>
  )
}
