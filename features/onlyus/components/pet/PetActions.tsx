'use client'

import { useState, useEffect } from 'react'

interface Props {
  canFeed: boolean
  canPlay: boolean
  onFeed: () => void
  onPlay: () => void
  onRename: () => void
}

function CooldownTimer({ endTime, onReady }: { endTime: number; onReady: () => void }) {
  const [remaining, setRemaining] = useState(Math.max(0, endTime - Date.now()))

  useEffect(() => {
    if (remaining <= 0) { onReady(); return }
    const t = setInterval(() => {
      const r = Math.max(0, endTime - Date.now())
      setRemaining(r)
      if (r <= 0) { onReady(); clearInterval(t) }
    }, 1000)
    return () => clearInterval(t)
  }, [endTime, onReady, remaining])

  if (remaining <= 0) return null

  const mins = Math.floor(remaining / 60000)
  const secs = Math.floor((remaining % 60000) / 1000)

  return (
    <span style={{
      fontSize: 10, color: 'rgba(61,35,24,0.3)',
      fontFamily: "'DM Sans', sans-serif",
      marginLeft: 4,
    }}>
      {mins}:{secs.toString().padStart(2, '0')}
    </span>
  )
}

export default function PetActions({ canFeed, canPlay, onFeed, onPlay, onRename }: Props) {
  const [feedAnim, setFeedAnim] = useState(false)
  const [playAnim, setPlayAnim] = useState(false)

  const handleFeed = () => {
    onFeed()
    setFeedAnim(true)
    setTimeout(() => setFeedAnim(false), 800)
  }

  const handlePlay = () => {
    onPlay()
    setPlayAnim(true)
    setTimeout(() => setPlayAnim(false), 800)
  }

  return (
    <div style={{ display: 'flex', gap: 10 }}>
      {/* Feed button */}
      <button
        onClick={handleFeed}
        disabled={!canFeed}
        style={{
          ...btnStyle,
          opacity: canFeed ? 1 : 0.4,
          background: canFeed ? 'linear-gradient(135deg, #7EB8D4, #A5D4E8)' : 'rgba(126,184,212,0.15)',
          color: canFeed ? '#fff' : 'rgba(61,35,24,0.3)',
          transform: feedAnim ? 'scale(0.95)' : 'scale(1)',
        }}
      >
        🍖 喂食
      </button>

      {/* Play button */}
      <button
        onClick={handlePlay}
        disabled={!canPlay}
        style={{
          ...btnStyle,
          opacity: canPlay ? 1 : 0.4,
          background: canPlay ? 'linear-gradient(135deg, #E8849C, #F0A0B5)' : 'rgba(232,132,156,0.15)',
          color: canPlay ? '#fff' : 'rgba(61,35,24,0.3)',
          transform: playAnim ? 'scale(0.95)' : 'scale(1)',
        }}
      >
        🎾 玩耍
      </button>

      {/* Rename button */}
      <button onClick={onRename} style={{
        ...btnStyle,
        background: 'rgba(196,120,90,0.08)',
        color: 'rgba(61,35,24,0.5)',
      }}>
        ✏️
      </button>
    </div>
  )
}

const btnStyle: React.CSSProperties = {
  flex: 1, padding: '12px 0', borderRadius: 14,
  border: 'none', fontSize: 13, cursor: 'pointer',
  fontFamily: "'DM Sans', sans-serif",
  transition: 'all 0.2s ease',
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
}
