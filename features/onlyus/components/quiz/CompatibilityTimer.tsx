'use client'

import { useEffect, useState, useRef } from 'react'

interface Props {
  seconds: number
  createdAt: string
  onTimeUp: () => void
  running: boolean
}

export default function CompatibilityTimer({ seconds, createdAt, onTimeUp, running }: Props) {
  const [remaining, setRemaining] = useState(seconds)
  const firedRef = useRef(false)

  useEffect(() => {
    if (!running) { firedRef.current = false; return }

    const calcRemaining = () => {
      const elapsed = Math.floor((Date.now() - new Date(createdAt).getTime()) / 1000)
      return Math.max(0, seconds - elapsed)
    }

    setRemaining(calcRemaining())

    const interval = setInterval(() => {
      const r = calcRemaining()
      setRemaining(r)
      if (r <= 0 && !firedRef.current) {
        firedRef.current = true
        clearInterval(interval)
        onTimeUp()
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [running, createdAt, seconds, onTimeUp])

  const progress = remaining / seconds
  const radius = 40
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference * (1 - progress)

  return (
    <div style={{ position: 'relative', width: 100, height: 100, margin: '0 auto' }}>
      <svg width="100" height="100" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={radius} fill="none"
          stroke="rgba(196,120,90,0.1)" strokeWidth="4" />
        <circle cx="50" cy="50" r={radius} fill="none"
          stroke={remaining <= 10 ? '#E8849C' : '#C4785A'}
          strokeWidth="4" strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          transform="rotate(-90 50 50)"
          style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.3s' }}
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: 24, color: remaining <= 10 ? '#E8849C' : '#3D2318',
          lineHeight: 1,
        }}>{remaining}</span>
        <span style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: 10, color: 'rgba(196,120,90,0.5)',
        }}>秒</span>
      </div>
    </div>
  )
}
