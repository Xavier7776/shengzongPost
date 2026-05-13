'use client'

import type { QuizScore } from '@/stores/onlyus/quizStore'

interface Props {
  scores: QuizScore[]
  myUserId: string
  partnerName: string
}

export default function ScoreBoard({ scores, myUserId, partnerName }: Props) {
  const myScore = scores.find(s => s.user_id === myUserId)
  const partnerScore = scores.find(s => s.user_id !== myUserId)

  return (
    <div style={{
      background: 'rgba(255,255,255,0.55)',
      backdropFilter: 'blur(16px)',
      borderRadius: 16,
      border: '1px solid rgba(196,120,90,0.12)',
      padding: '18px 20px',
    }}>
      <p style={{
        fontFamily: "'Cormorant Garamond', serif", fontSize: 11,
        letterSpacing: '0.2em', textTransform: 'uppercase',
        color: 'rgba(196,120,90,0.6)', margin: '0 0 12px',
      }}>积分面板</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: 11, color: 'rgba(232,132,156,0.7)', margin: '0 0 4px', fontFamily: "'DM Sans', sans-serif" }}>我</p>
          <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, color: '#E8849C' }}>
            {myScore?.total_score || 0}
          </span>
          <p style={{ fontSize: 10, color: 'rgba(61,35,24,0.3)', margin: '2px 0 0' }}>
            匹配 {myScore?.total_matches || 0}/{myScore?.total_played || 0}
          </p>
        </div>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: 11, color: 'rgba(196,120,90,0.7)', margin: '0 0 4px', fontFamily: "'DM Sans', sans-serif" }}>{partnerName}</p>
          <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, color: '#C4785A' }}>
            {partnerScore?.total_score || 0}
          </span>
          <p style={{ fontSize: 10, color: 'rgba(61,35,24,0.3)', margin: '2px 0 0' }}>
            匹配 {partnerScore?.total_matches || 0}/{partnerScore?.total_played || 0}
          </p>
        </div>
      </div>
    </div>
  )
}
