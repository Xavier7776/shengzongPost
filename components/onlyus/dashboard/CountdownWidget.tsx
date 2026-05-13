'use client'

import { useEffect, useState, useRef } from 'react'
import dayjs from 'dayjs'
import { useCountdownStore, type Countdown } from '@/stores/onlyus/countdownStore'

function useCountUp(target: number, duration = 1000) {
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

function CountdownRow({ emoji, label, days, color = '#3D2318' }: { emoji: string; label: string; days: number; color?: string }) {
  const animatedDays = useCountUp(days, 800)

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <span style={{ fontSize: 18, flexShrink: 0 }}>{emoji}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          margin: 0, fontSize: 11, color: 'rgba(61,35,24,0.5)',
          fontFamily: "'DM Sans', sans-serif",
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>{label}</p>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 2, flexShrink: 0 }}>
        <span style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: 24, fontWeight: 400, color, lineHeight: 1,
        }}>{animatedDays}</span>
        <span style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: 12, fontStyle: 'italic', color: 'rgba(196,120,90,0.6)',
        }}>天</span>
      </div>
    </div>
  )
}

interface CountdownWidgetProps {
  meetupDate: string | null | undefined
  anniversaryDate: string | null | undefined
  coupleId?: string
}

export default function CountdownWidget({ meetupDate, anniversaryDate, coupleId }: CountdownWidgetProps) {
  const { customCountdowns, loadCountdowns } = useCountdownStore()

  useEffect(() => {
    if (coupleId) loadCountdowns(coupleId)
  }, [coupleId, loadCountdowns])

  const today = dayjs()
  const rows: { emoji: string; label: string; days: number; color?: string }[] = []

  // 距离下次见面
  if (meetupDate) {
    const days = dayjs(meetupDate).diff(today, 'day')
    if (days > 0) rows.push({ emoji: '✈️', label: '下次见面', days, color: '#E8849C' })
  }

  // 距离下一个纪念日里程碑
  if (anniversaryDate) {
    const daysTogether = today.diff(dayjs(anniversaryDate), 'day')
    const milestones = [100, 200, 365, 500, 520, 1000]
    const nextMilestone = milestones.find(m => m > daysTogether)
    if (nextMilestone) {
      const targetDate = dayjs(anniversaryDate).add(nextMilestone, 'day')
      const days = targetDate.diff(today, 'day')
      if (days > 0) rows.push({ emoji: '🎯', label: `${nextMilestone}天纪念`, days, color: '#C4785A' })
    }
  }

  // 自定义倒数日（取最近的）
  const nearestCustom = customCountdowns
    .filter(c => dayjs(c.target_date).isAfter(today))
    .sort((a, b) => a.target_date.localeCompare(b.target_date))[0]
  if (nearestCustom) {
    const days = dayjs(nearestCustom.target_date).diff(today, 'day')
    rows.push({ emoji: nearestCustom.emoji, label: nearestCustom.title, days })
  }

  return (
    <div style={{
      background: 'rgba(255,255,255,0.55)',
      backdropFilter: 'blur(16px)',
      borderRadius: 20,
      border: '1px solid rgba(196,120,90,0.12)',
      padding: '24px 28px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', top: -30, right: -30,
        width: 120, height: 120, borderRadius: '50%',
        background: 'radial-gradient(ellipse, rgba(232,132,156,0.06), transparent 70%)',
        pointerEvents: 'none',
      }} />

      <p style={{
        fontFamily: "'Cormorant Garamond', serif",
        fontSize: 11, letterSpacing: '0.3em',
        textTransform: 'uppercase',
        color: 'rgba(196,120,90,0.7)',
        margin: '0 0 16px',
      }}>
        倒数日
      </p>

      {rows.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {rows.map((row, i) => (
            <CountdownRow key={i} {...row} />
          ))}
        </div>
      ) : (
        <p style={{
          fontSize: 12, color: 'rgba(61,35,24,0.3)',
          fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic',
          margin: 0,
        }}>
          在设置中填写见面日期，或添加自定义倒数日
        </p>
      )}
    </div>
  )
}
