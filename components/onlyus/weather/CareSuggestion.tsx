'use client'

import { useState } from 'react'
import { useCareStore } from '@/stores/onlyus/careStore'

interface Props {
  temp: number; weatherCode: number; windspeed: number
  senderId: string; receiverId: string; receiverName: string
}

interface Suggestion {
  text: string; type: string; emoji: string
}

function getSuggestion(temp: number, code: number, wind: number): Suggestion | null {
  if (code >= 51 && code <= 69) return { text: '下雨了，提醒 Ta 带伞', type: 'rain', emoji: '🌂' }
  if (code >= 80 && code <= 82) return { text: '有阵雨，让 Ta 出门带伞', type: 'rain', emoji: '🌧️' }
  if (temp < 5) return { text: '降温了，让 Ta 多穿点', type: 'cold', emoji: '🧣' }
  if (temp > 35) return { text: '好热，提醒 Ta 多喝水', type: 'hot', emoji: '💧' }
  if (wind > 30) return { text: '风好大，提醒 Ta 注意安全', type: 'wind', emoji: '💨' }
  return null
}

export default function CareSuggestion({ temp, weatherCode, windspeed, senderId, receiverId, receiverName }: Props) {
  const { sendCare } = useCareStore()
  const [sent, setSent] = useState(false)

  const suggestion = getSuggestion(temp, weatherCode, windspeed)
  if (!suggestion) return null

  const handleSend = async () => {
    await sendCare(senderId, receiverId, suggestion.type, suggestion.text)
    setSent(true)
    setTimeout(() => setSent(false), 3000)
  }

  return (
    <div style={{
      marginTop: 14, padding: '10px 14px',
      borderRadius: 12,
      background: 'rgba(232,132,156,0.06)',
      border: '1px solid rgba(232,132,156,0.12)',
      display: 'flex', alignItems: 'center', gap: 10,
    }}>
      <span style={{ fontSize: 18, flexShrink: 0 }}>{suggestion.emoji}</span>
      <span style={{
        flex: 1, fontSize: 12,
        fontFamily: "'DM Sans', sans-serif",
        color: '#3D2318',
      }}>{suggestion.text}</span>
      <button onClick={handleSend} disabled={sent} style={{
        padding: '5px 12px', borderRadius: 8,
        border: 'none',
        background: sent ? 'rgba(107,197,160,0.15)' : 'rgba(232,132,156,0.12)',
        color: sent ? '#6BC5A0' : '#E8849C',
        fontSize: 11, cursor: 'pointer',
        fontFamily: "'DM Sans', sans-serif",
        whiteSpace: 'nowrap',
      }}>
        {sent ? '已发送 ✓' : `提醒${receiverName}`}
      </button>
    </div>
  )
}
