'use client'

import type { QuizSession } from '@/stores/onlyus/quizStore'

interface Props {
  session: QuizSession
  myUserId: string
  myName: string
  partnerName: string
  onEdit?: () => void
}

export default function AnswerReveal({ session, myUserId, myName, partnerName, onEdit }: Props) {
  const isMatch = session.is_match

  // 根据当前用户判断哪个答案是自己的
  const isUser1 = myUserId === session.user1_id
  const myAnswer = isUser1 ? session.user1_answer : session.user2_answer
  const partnerAnswer = isUser1 ? session.user2_answer : session.user1_answer

  return (
    <div style={{
      background: 'rgba(255,255,255,0.55)',
      backdropFilter: 'blur(16px)',
      borderRadius: 20,
      border: '1px solid rgba(196,120,90,0.12)',
      padding: '28px 24px',
      textAlign: 'center',
    }}>
      {/* 结果标识 */}
      <div style={{
        width: 60, height: 60, borderRadius: '50%', margin: '0 auto 16px',
        background: isMatch ? 'rgba(107,197,160,0.12)' : 'rgba(196,120,90,0.1)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ fontSize: 28 }}>{isMatch ? '💕' : '🤔'}</span>
      </div>

      <h2 style={{
        fontFamily: "'Playfair Display', serif", fontSize: 20,
        fontWeight: 400, color: '#3D2318', margin: '0 0 4px',
      }}>
        {isMatch ? '心有灵犀！' : '答案不同~'}
      </h2>
      <p style={{
        fontFamily: "'Cormorant Garamond', serif", fontSize: 12,
        color: 'rgba(196,120,90,0.6)', margin: '0 0 24px', fontStyle: 'italic',
      }}>
        {isMatch ? '你们的答案一致，加 10 分' : '没关系，下次更默契'}
      </p>

      {/* 题目 */}
      {session.question && (
        <p style={{
          fontSize: 13, color: 'rgba(61,35,24,0.5)',
          fontFamily: "'DM Sans', sans-serif",
          margin: '0 0 20px',
        }}>{session.question.question_text}</p>
      )}

      {/* 双栏答案对比 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div style={{
          background: 'rgba(232,132,156,0.06)',
          borderRadius: 14, padding: '16px 12px',
          border: '1px solid rgba(232,132,156,0.12)',
        }}>
          <p style={{
            fontSize: 10, fontFamily: "'Cormorant Garamond', serif",
            letterSpacing: '0.15em', color: 'rgba(232,132,156,0.7)',
            margin: '0 0 8px', textTransform: 'uppercase',
          }}>{myName}</p>
          <p style={{
            fontSize: 15, fontFamily: "'Playfair Display', serif",
            color: '#3D2318', margin: 0,
          }}>{myAnswer || '未作答'}</p>
        </div>
        <div style={{
          background: 'rgba(196,120,90,0.06)',
          borderRadius: 14, padding: '16px 12px',
          border: '1px solid rgba(196,120,90,0.12)',
        }}>
          <p style={{
            fontSize: 10, fontFamily: "'Cormorant Garamond', serif",
            letterSpacing: '0.15em', color: 'rgba(196,120,90,0.7)',
            margin: '0 0 8px', textTransform: 'uppercase',
          }}>{partnerName}</p>
          <p style={{
            fontSize: 15, fontFamily: "'Playfair Display', serif",
            color: '#3D2318', margin: 0,
          }}>{partnerAnswer || '未作答'}</p>
        </div>
      </div>

      {/* 修改答案按钮 */}
      {onEdit && (
        <button onClick={onEdit} style={{
          marginTop: 16, padding: '8px 24px', borderRadius: 10,
          border: '1px solid rgba(155,142,196,0.3)',
          background: 'rgba(155,142,196,0.08)',
          color: '#9B8EC4', fontSize: 12, cursor: 'pointer',
          fontFamily: "'DM Sans', sans-serif",
        }}>修改答案</button>
      )}
    </div>
  )
}
