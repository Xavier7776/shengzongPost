'use client'

import { useState } from 'react'
import type { QuizQuestion } from '@/stores/onlyus/quizStore'

interface Props {
  question: QuizQuestion
  onSubmit: (answer: string) => void
  answered: boolean
}

export default function QuestionCard({ question, onSubmit, answered }: Props) {
  const [openAnswer, setOpenAnswer] = useState('')
  const [selectedOption, setSelectedOption] = useState('')

  const handleSubmit = () => {
    const answer = question.question_type === 'choice' ? selectedOption : openAnswer.trim()
    if (answer) onSubmit(answer)
  }

  return (
    <div style={{
      background: 'rgba(255,255,255,0.55)',
      backdropFilter: 'blur(16px)',
      borderRadius: 20,
      border: '1px solid rgba(196,120,90,0.12)',
      padding: '28px 24px',
      textAlign: 'center',
    }}>
      <span style={{
        display: 'inline-block', fontSize: 10, padding: '3px 10px',
        borderRadius: 10, background: 'rgba(196,120,90,0.08)',
        color: 'rgba(196,120,90,0.7)',
        fontFamily: "'DM Sans', sans-serif",
        marginBottom: 14,
      }}>{question.category}</span>

      <h2 style={{
        fontFamily: "'Playfair Display', serif",
        fontSize: 20, fontWeight: 400, color: '#3D2318',
        margin: '0 0 24px', lineHeight: 1.4,
      }}>{question.question_text}</h2>

      {question.question_type === 'choice' && question.options ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
          {question.options.map((opt) => (
            <button key={opt} onClick={() => !answered && setSelectedOption(opt)} style={{
              padding: '12px 16px', borderRadius: 12,
              border: selectedOption === opt ? '2px solid #C4785A' : '1px solid rgba(196,120,90,0.15)',
              background: selectedOption === opt ? 'rgba(196,120,90,0.08)' : 'rgba(255,255,255,0.5)',
              color: '#3D2318', fontSize: 14, cursor: answered ? 'default' : 'pointer',
              fontFamily: "'DM Sans', sans-serif",
              transition: 'all 0.2s',
            }}>{opt}</button>
          ))}
        </div>
      ) : (
        <textarea
          value={openAnswer}
          onChange={(e) => setOpenAnswer(e.target.value)}
          placeholder="输入你的答案..."
          disabled={answered}
          style={{
            width: '100%', minHeight: 80, padding: '12px 14px',
            borderRadius: 12, border: '1px solid rgba(196,120,90,0.15)',
            background: 'rgba(255,255,255,0.5)',
            fontFamily: "'DM Sans', sans-serif", fontSize: 14,
            color: '#3D2318', outline: 'none', resize: 'vertical',
            marginBottom: 20, boxSizing: 'border-box',
          }}
        />
      )}

      {!answered && (
        <button onClick={handleSubmit} disabled={question.question_type === 'choice' ? !selectedOption : !openAnswer.trim()} style={{
          padding: '10px 32px', borderRadius: 12,
          border: 'none',
          background: 'linear-gradient(135deg, #C4785A, #E8849C)',
          color: '#fff', fontSize: 14, cursor: 'pointer',
          fontFamily: "'DM Sans', sans-serif",
          opacity: (question.question_type === 'choice' ? !selectedOption : !openAnswer.trim()) ? 0.4 : 1,
          transition: 'opacity 0.2s',
        }}>提交答案</button>
      )}

      {answered && (
        <p style={{
          fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic',
          fontSize: 13, color: 'rgba(196,120,90,0.6)', margin: '12px 0 0',
        }}>等待对方作答中...</p>
      )}
    </div>
  )
}
