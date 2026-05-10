'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { useOnlyUsAuthStore } from '@/stores/onlyus/authStore'
import { useMoodStore } from '@/stores/onlyus/moodStore'

const MOOD_MAP: Record<string, { emoji: string; label: string; color: string }> = {
  happy:     { emoji: '😊', label: '开心',   color: '#F5A623' },
  excited:   { emoji: '🤩', label: '兴奋',   color: '#E8849C' },
  calm:      { emoji: '😌', label: '平静',   color: '#7EB8D4' },
  tired:     { emoji: '😴', label: '疲惫',   color: '#A09BB0' },
  sad:       { emoji: '😢', label: '难过',   color: '#6B9BD2' },
  anxious:   { emoji: '😰', label: '焦虑',   color: '#C4785A' },
  loved:     { emoji: '🥰', label: '幸福',   color: '#E8849C' },
  angry:     { emoji: '😤', label: '生气',   color: '#D4584A' },
  meh:       { emoji: '😑', label: '一般',   color: '#9CA3AF' },
  cozy:      { emoji: '☕', label: '惬意',   color: '#C4785A' },
  love:      { emoji: '💕', label: '爱你',   color: '#E8849C' },
  missing:   { emoji: '🥺', label: '想你',   color: '#7EB8D4' },
}

export default function MoodSummaryCard() {
  const { profile, partner } = useOnlyUsAuthStore()
  const { myMood, partnerMood, loadMyMood, loadPartnerMood } = useMoodStore()

  useEffect(() => {
    if (profile?.id) loadMyMood(profile.id)
    if (partner?.id) loadPartnerMood(partner.id)
  }, [profile?.id, partner?.id, loadMyMood, loadPartnerMood])

  const myInfo = myMood ? MOOD_MAP[myMood] : null
  const partnerInfo = partnerMood ? MOOD_MAP[partnerMood] : null

  return (
    <Link href="/onlyus/mood" style={{ textDecoration: 'none' }}>
      <div style={{
        background: 'rgba(255,255,255,0.55)',
        backdropFilter: 'blur(16px)',
        borderRadius: 20,
        border: '1px solid rgba(196,120,90,0.1)',
        padding: '24px 28px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
      }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'
          ;(e.currentTarget as HTMLElement).style.boxShadow = '0 8px 32px rgba(196,120,90,0.1)'
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'
          ;(e.currentTarget as HTMLElement).style.boxShadow = 'none'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <p style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: 11, letterSpacing: '0.3em',
            textTransform: 'uppercase',
            color: 'rgba(196,120,90,0.7)',
            margin: 0,
          }}>
            今日心情
          </p>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(196,120,90,0.4)" strokeWidth="2" strokeLinecap="round">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </div>

        <div style={{ display: 'flex', gap: 16 }}>
          {[
            { info: myInfo, name: profile?.nickname ?? 'Me', mood: myMood },
            { info: partnerInfo, name: partner?.nickname ?? 'Ta', mood: partnerMood },
          ].map(({ info, name, mood }, i) => (
            <div key={i} style={{
              flex: 1, padding: '14px 16px', borderRadius: 12,
              background: info
                ? `linear-gradient(135deg, ${info.color}14, ${info.color}08)`
                : 'rgba(196,120,90,0.04)',
              border: `1px solid ${info ? info.color + '22' : 'rgba(196,120,90,0.08)'}`,
              textAlign: 'center',
            }}>
              <div style={{ fontSize: 28, marginBottom: 6 }}>
                {info ? info.emoji : '—'}
              </div>
              <p style={{
                fontSize: 12, margin: '0 0 3px',
                color: info ? info.color : 'rgba(61,35,24,0.3)',
                fontFamily: "'DM Sans', sans-serif",
                fontWeight: 500,
              }}>
                {info ? info.label : '未记录'}
              </p>
              <p style={{
                fontSize: 10, margin: 0,
                color: 'rgba(61,35,24,0.35)',
                fontFamily: "'DM Sans', sans-serif",
                letterSpacing: '0.03em',
              }}>
                {name}
              </p>
            </div>
          ))}
        </div>
      </div>
    </Link>
  )
}
