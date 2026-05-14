'use client'

import { useEffect, useState, useCallback } from 'react'
import { useOnlyUsAuthStore } from '@/stores/onlyus/authStore'
import { useQuizStore, type QuizSession } from '@/stores/onlyus/quizStore'
import { useMedalStore } from '@/stores/onlyus/medalStore'
import QuestionCard from '@/components/onlyus/quiz/QuestionCard'
import AnswerReveal from '@/components/onlyus/quiz/AnswerReveal'
import CompatibilityTimer from '@/components/onlyus/quiz/CompatibilityTimer'
import ScoreBoard from '@/components/onlyus/quiz/ScoreBoard'

type Tab = 'quiz' | 'compatibility'

export default function QuizPage() {
  const { profile, partner, coupleInfo } = useOnlyUsAuthStore()
  const {
    questions, currentSession, scores, history, loadError,
    loadQuestions, loadScores, loadHistory,
    startSession, findOrJoinSession, submitAnswer, revealSession, setCurrentSession, subscribeToSession,
  } = useQuizStore()
  const { checkAndUnlock, loadMedals } = useMedalStore()

  const [tab, setTab] = useState<Tab>('quiz')
  const [showHistory, setShowHistory] = useState(false)
  const [compatRunning, setCompatRunning] = useState(false)

  const coupleId = coupleInfo?.id
  const userId = profile?.id
  const myName = profile?.nickname || '我'
  const partnerName = partner?.nickname || 'Ta'

  useEffect(() => {
    loadQuestions()
    loadMedals()
    if (coupleId) {
      loadScores(coupleId)
      loadHistory(coupleId)
    }
  }, [coupleId, loadQuestions, loadScores, loadHistory, loadMedals])

  const pickRandomQuestion = () => {
    if (questions.length === 0) return null
    const recentIds = history.slice(0, 5).map(h => h.question_id)
    const available = questions.filter(q => !recentIds.includes(q.id))
    const pool = available.length > 0 ? available : questions
    return pool[Math.floor(Math.random() * pool.length)]
  }

  // ── 开始/加入双人问答 ────────────────────────────────────────
  const handleStartQuiz = async () => {
    if (!coupleId || !userId) { alert('请先设置情侣关系'); return }
    if (questions.length === 0) {
      alert(loadError ? `题库加载失败: ${loadError}` : '题库为空，请检查数据库迁移 039 是否已执行')
      return
    }
    try {
      const existing = await findOrJoinSession(coupleId, userId, 'quiz')
      if (existing) return
      const q = pickRandomQuestion()
      if (!q) return
      await startSession(coupleId, q.id, userId, 'quiz')
    } catch (err: any) {
      console.error('Quiz start error:', err)
      alert(`启动失败: ${err?.message || JSON.stringify(err)}`)
    }
  }

  // ── 开始/加入默契挑战 ────────────────────────────────────────
  const handleStartCompatibility = async () => {
    if (!coupleId || !userId) { alert('请先设置情侣关系'); return }
    if (questions.length === 0) {
      alert(loadError ? `题库加载失败: ${loadError}` : '题库为空，请检查数据库迁移 039 是否已执行')
      return
    }
    try {
      const existing = await findOrJoinSession(coupleId, userId, 'compatibility')
      if (existing) {
        // 加入已有的 session，检查是否已超时
        const elapsed = (Date.now() - new Date(existing.created_at).getTime()) / 1000
        if (elapsed >= 60 && existing.status === 'waiting') {
          await revealSession(existing.id)
        } else {
          setCompatRunning(true)
        }
        return
      }
      const q = pickRandomQuestion()
      if (!q) return
      await startSession(coupleId, q.id, userId, 'compatibility')
      setCompatRunning(true)
    } catch (err: any) {
      console.error('Compatibility start error:', err)
      alert(`启动失败: ${err?.message || JSON.stringify(err)}`)
    }
  }

  // ── 提交答案 ────────────────────────────────────────────────
  const handleSubmitAnswer = useCallback(async (answer: string) => {
    if (!currentSession || !userId) return
    await submitAnswer(currentSession.id, userId, answer)
    if (coupleId) checkAndUnlock(userId, coupleId, 'quiz_first')
  }, [currentSession, userId, coupleId, submitAnswer, checkAndUnlock])

  // ── 默契挑战倒计时结束 → 揭晓 ──────────────────────────────
  const handleTimeUp = useCallback(async () => {
    setCompatRunning(false)
    if (currentSession && currentSession.status === 'waiting') {
      await revealSession(currentSession.id)
    }
  }, [currentSession, revealSession])

  // ── 下一题（不回到开始页） ──────────────────────────────────
  const handleNextRound = useCallback(async () => {
    setCurrentSession(null)
    setCompatRunning(false)
    if (coupleId && userId && questions.length > 0) {
      const mode = tab
      try {
        const existing = await findOrJoinSession(coupleId, userId, mode)
        if (existing) {
          if (mode === 'compatibility') {
            const elapsed = (Date.now() - new Date(existing.created_at).getTime()) / 1000
            if (elapsed >= 60 && existing.status === 'waiting') {
              await revealSession(existing.id)
            } else {
              setCompatRunning(true)
            }
          }
          return
        }
        const q = pickRandomQuestion()
        if (!q) return
        await startSession(coupleId, q.id, userId, mode)
        if (mode === 'compatibility') setCompatRunning(true)
      } catch (err) {
        console.error('Next round error:', err)
      }
    }
    if (coupleId) {
      loadScores(coupleId)
      loadHistory(coupleId)
    }
  }, [coupleId, userId, questions, tab, findOrJoinSession, startSession, revealSession, setCurrentSession, loadScores, loadHistory])

  // ── 订阅 session 实时更新 ──────────────────────────────────
  useEffect(() => {
    if (!currentSession) return
    const unsub = subscribeToSession(currentSession.id, (updated) => {
      if (updated.status === 'revealed' && updated.is_match && userId && coupleId) {
        const matchCount = (scores.find(s => s.user_id === userId)?.total_matches || 0) + 1
        if (matchCount >= 5) checkAndUnlock(userId, coupleId, 'quiz_perfect')
      }
      // 如果收到揭晓事件，停止倒计时
      if (updated.status === 'revealed') setCompatRunning(false)
    })
    return unsub
  }, [currentSession?.id])

  // ── 切换 tab 时重置 ────────────────────────────────────────
  const handleTabChange = (t: Tab) => {
    setTab(t)
    setCurrentSession(null)
    setCompatRunning(false)
  }

  // 判断当前用户是否已回答
  const myAnswered = currentSession
    ? (userId === currentSession.user1_id ? currentSession.user1_answer : currentSession.user2_answer) !== null
    : false

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;1,400&family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=DM+Sans:wght@400;500&display=swap');
        @keyframes card-rise { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        .quiz-card { animation: card-rise 0.55s cubic-bezier(0.16,1,0.3,1) both; }
      `}</style>

      <div style={{ minHeight: '100%', padding: '40px 24px 80px', maxWidth: 600, margin: '0 auto' }}>
        {/* 标题 */}
        <div className="quiz-card" style={{ marginBottom: 24 }}>
          <p style={{
            fontFamily: "'Cormorant Garamond', serif", fontSize: 11,
            letterSpacing: '0.3em', textTransform: 'uppercase',
            color: 'rgba(196,120,90,0.7)', margin: '0 0 6px',
          }}>Couple Quiz</p>
          <h1 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 'clamp(24px, 4vw, 32px)',
            fontWeight: 400, color: '#3D2318', margin: 0,
          }}>双人问答</h1>
        </div>

        {/* Tab 切换 */}
        <div className="quiz-card" style={{
          animationDelay: '60ms', marginBottom: 24,
          display: 'flex', gap: 0,
          background: 'rgba(255,255,255,0.4)',
          borderRadius: 14, overflow: 'hidden',
          border: '1px solid rgba(196,120,90,0.1)',
        }}>
          {([['quiz', '双人问答'], ['compatibility', '默契挑战']] as const).map(([key, label]) => (
            <button key={key} onClick={() => handleTabChange(key as Tab)} style={{
              flex: 1, padding: '10px 0', border: 'none',
              background: tab === key ? 'rgba(196,120,90,0.12)' : 'transparent',
              color: tab === key ? '#C4785A' : 'rgba(61,35,24,0.4)',
              fontSize: 13, cursor: 'pointer',
              fontFamily: "'DM Sans', sans-serif",
              transition: 'all 0.2s',
            }}>{label}</button>
          ))}
        </div>

        {/* 主内容 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {currentSession ? (
            <>
              {/* 默契模式倒计时 */}
              {tab === 'compatibility' && currentSession.status === 'waiting' && (
                <div className="quiz-card" style={{ animationDelay: '80ms' }}>
                  <CompatibilityTimer
                    seconds={60}
                    createdAt={currentSession.created_at}
                    onTimeUp={handleTimeUp}
                    running={compatRunning}
                  />
                </div>
              )}

              {/* 题目 / 答案揭晓 */}
              {currentSession.status === 'revealed' ? (
                <div className="quiz-card" style={{ animationDelay: '100ms' }}>
                  <AnswerReveal
                    session={currentSession}
                    myUserId={userId || ''}
                    myName={myName}
                    partnerName={partnerName}
                  />
                  <button onClick={handleNextRound} style={{
                    width: '100%', marginTop: 16, padding: '12px 0',
                    borderRadius: 12, border: 'none',
                    background: 'linear-gradient(135deg, #C4785A, #E8849C)',
                    color: '#fff', fontSize: 14, cursor: 'pointer',
                    fontFamily: "'DM Sans', sans-serif",
                  }}>下一题 →</button>
                </div>
              ) : (
                currentSession.question && (
                  <div className="quiz-card" style={{ animationDelay: '100ms' }}>
                    <QuestionCard
                      question={currentSession.question}
                      onSubmit={handleSubmitAnswer}
                      answered={!!myAnswered}
                    />
                  </div>
                )
              )}
            </>
          ) : (
            /* 开始按钮 */
            <div className="quiz-card" style={{
              animationDelay: '100ms',
              background: 'rgba(255,255,255,0.55)',
              backdropFilter: 'blur(16px)',
              borderRadius: 20,
              border: '1px solid rgba(196,120,90,0.12)',
              padding: '40px 24px',
              textAlign: 'center',
            }}>
              <span style={{ fontSize: 48, display: 'block', marginBottom: 16 }}>
                {tab === 'quiz' ? '❓' : '⏱️'}
              </span>
              <h2 style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 20, fontWeight: 400, color: '#3D2318',
                margin: '0 0 8px',
              }}>
                {tab === 'quiz' ? '测试你们的了解程度' : '60 秒默契大考验'}
              </h2>
              <p style={{
                fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic',
                fontSize: 13, color: 'rgba(196,120,90,0.5)', margin: '0 0 24px',
              }}>
                {tab === 'quiz' ? '轮流答题，看看你们有多了解对方' : '同时作答，看看你们有多默契'}
              </p>
              <button onClick={tab === 'quiz' ? handleStartQuiz : handleStartCompatibility} style={{
                padding: '12px 40px', borderRadius: 14,
                border: 'none',
                background: 'linear-gradient(135deg, #C4785A, #E8849C)',
                color: '#fff', fontSize: 15, cursor: 'pointer',
                fontFamily: "'DM Sans', sans-serif",
                boxShadow: '0 4px 16px rgba(196,120,90,0.25)',
              }}>开始挑战</button>
              {loadError && (
                <div style={{ marginTop: 16 }}>
                  <p style={{
                    fontSize: 11, color: 'rgba(196,80,60,0.8)',
                    fontFamily: "'DM Sans', sans-serif",
                    margin: '0 0 8px', wordBreak: 'break-all',
                  }}>加载失败: {loadError}</p>
                  <button onClick={() => loadQuestions()} style={{
                    padding: '6px 20px', borderRadius: 8,
                    border: '1px solid rgba(196,120,90,0.3)',
                    background: 'rgba(255,255,255,0.5)',
                    color: '#C4785A', fontSize: 12, cursor: 'pointer',
                    fontFamily: "'DM Sans', sans-serif",
                  }}>重新加载</button>
                </div>
              )}
            </div>
          )}

          {/* 积分面板 */}
          <div className="quiz-card" style={{ animationDelay: '200ms' }}>
            <ScoreBoard scores={scores} myUserId={userId || ''} partnerName={partnerName} />
          </div>

          {/* 历史记录 */}
          <div className="quiz-card" style={{ animationDelay: '250ms' }}>
            <button onClick={() => setShowHistory(!showHistory)} style={{
              width: '100%', padding: '14px 20px',
              background: 'rgba(255,255,255,0.55)',
              backdropFilter: 'blur(16px)',
              borderRadius: 16,
              border: '1px solid rgba(196,120,90,0.12)',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <span style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: 12, letterSpacing: '0.15em',
                color: 'rgba(196,120,90,0.6)', textTransform: 'uppercase',
              }}>答题历史</span>
              <span style={{
                transform: showHistory ? 'rotate(180deg)' : 'rotate(0)',
                transition: 'transform 0.2s',
                color: 'rgba(196,120,90,0.4)',
              }}>▾</span>
            </button>
            {showHistory && (
              <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {history.length === 0 ? (
                  <p style={{
                    textAlign: 'center', padding: '16px 0',
                    fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic',
                    fontSize: 12, color: 'rgba(61,35,24,0.3)',
                  }}>还没有答题记录</p>
                ) : history.map((h) => (
                  <div key={h.id} style={{
                    padding: '10px 14px',
                    background: 'rgba(255,255,255,0.4)',
                    borderRadius: 10,
                    display: 'flex', alignItems: 'center', gap: 10,
                  }}>
                    <span style={{ fontSize: 16, flexShrink: 0 }}>
                      {h.is_match === true ? '💕' : h.is_match === false ? '🤔' : '⏳'}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{
                        margin: 0, fontSize: 12, color: '#3D2318',
                        fontFamily: "'DM Sans', sans-serif",
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>{(h as any).question?.question_text || '题目'}</p>
                      <p style={{
                        margin: '2px 0 0', fontSize: 10,
                        color: 'rgba(61,35,24,0.3)',
                      }}>{new Date(h.created_at).toLocaleDateString('zh-CN')}</p>
                    </div>
                    {h.score_awarded > 0 && (
                      <span style={{
                        fontSize: 11, color: '#E8849C',
                        fontFamily: "'DM Sans', sans-serif",
                      }}>+{h.score_awarded}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
