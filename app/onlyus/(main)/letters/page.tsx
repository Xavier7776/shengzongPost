'use client'

import { useState, useEffect, useRef } from 'react'
import { useOnlyUsAuthStore } from '@/stores/onlyus/authStore'
import { useLetterStore, type Letter } from '@/stores/onlyus/letterStore'
import { useDiaryStore, type DiaryEntry, type DiaryVisibility } from '@/stores/onlyus/diaryStore'
import dayjs from 'dayjs'

// ── 3D 信封组件 ──────────────────────────────────────────────────────
function Envelope3D({ letter, onClick }: { letter: Letter; onClick: () => void }) {
  const [flipped, setFlipped] = useState(false)
  const isDelivered = letter.delivered
  const daysLeft = dayjs(letter.scheduled_at).diff(dayjs(), 'day')

  return (
    <div
      style={{ perspective: 800, cursor: 'pointer', width: '100%' }}
      onMouseEnter={() => setFlipped(true)}
      onMouseLeave={() => setFlipped(false)}
      onClick={onClick}
    >
      <div style={{
        position: 'relative', width: '100%', height: 140,
        transformStyle: 'preserve-3d',
        transform: flipped ? 'rotateY(12deg) rotateX(-4deg)' : 'rotateY(0deg)',
        transition: 'transform 0.4s cubic-bezier(0.16,1,0.3,1)',
      }}>
        {/* 信封主体 */}
        <div style={{
          width: '100%', height: '100%',
          background: isDelivered
            ? 'linear-gradient(135deg, #FFF8F0, #FFF3E8)'
            : 'linear-gradient(135deg, #F8F6F3, #F0EBE5)',
          borderRadius: 14,
          border: `1px solid ${isDelivered ? 'rgba(196,120,90,0.3)' : 'rgba(196,120,90,0.12)'}`,
          boxShadow: flipped
            ? '8px 12px 32px rgba(196,120,90,0.2), 2px 4px 8px rgba(0,0,0,0.06)'
            : '2px 4px 12px rgba(196,120,90,0.1)',
          padding: '20px 22px',
          position: 'relative',
          overflow: 'hidden',
          transition: 'box-shadow 0.4s ease',
        }}>
          {/* 信封内折线装饰 */}
          <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
            viewBox="0 0 300 140" preserveAspectRatio="none">
            <path d="M 0 0 L 150 75 L 300 0" fill="none" stroke="rgba(196,120,90,0.08)" strokeWidth="1" />
          </svg>

          {/* 蜡封 */}
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 36, height: 36, borderRadius: '50%',
            background: isDelivered
              ? 'linear-gradient(135deg, #C4785A, #D4956B)'
              : 'linear-gradient(135deg, #E8849C, #C4785A)',
            boxShadow: `0 2px 8px ${isDelivered ? 'rgba(196,120,90,0.4)' : 'rgba(232,132,156,0.4)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 2,
          }}>
            <svg width="16" height="14" viewBox="0 0 24 22" fill="rgba(255,255,255,0.85)">
              <path d="M12 20.5C12 20.5 2 13.5 2 7.5C2 4.46 4.46 2 7.5 2C9.24 2 10.91 2.81 12 4.08C13.09 2.81 14.76 2 16.5 2C19.54 2 22 4.46 22 7.5C22 13.5 12 20.5 12 20.5Z" />
            </svg>
          </div>

          {/* 信息 */}
          <div style={{ position: 'absolute', bottom: 14, left: 22, right: 22, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div>
              <p style={{ margin: 0, fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: isDelivered ? 'rgba(196,120,90,0.6)' : 'rgba(61,35,24,0.3)', fontFamily: "'DM Sans', sans-serif" }}>
                {isDelivered ? '已送达' : `${daysLeft > 0 ? daysLeft + '天后' : '今天'}送达`}
              </p>
              <p style={{ margin: '2px 0 0', fontSize: 11, color: 'rgba(61,35,24,0.5)', fontFamily: "'DM Sans', sans-serif" }}>
                {dayjs(letter.scheduled_at).format('YYYY · MM · DD')}
              </p>
            </div>
            {flipped && (
              <span style={{ fontSize: 10, color: 'rgba(196,120,90,0.5)', fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic' }}>
                点击{isDelivered ? '阅读' : '查看'}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── 写信弹窗 ────────────────────────────────────────────────────────
function WriteLetterModal({ onClose, onSend }: { onClose: () => void; onSend: (content: string, date: string) => void }) {
  const [content, setContent] = useState('')
  const [scheduledAt, setScheduledAt] = useState(dayjs().add(7, 'day').format('YYYY-MM-DD'))
  const [sending, setSending] = useState(false)

  const handleSend = async () => {
    if (!content.trim()) return
    setSending(true)
    await onSend(content.trim(), scheduledAt)
    setSending(false)
    onClose()
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(61,35,24,0.4)',
      backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24,
    }} onClick={onClose}>
      <div style={{
        width: '100%', maxWidth: 520,
        background: 'rgba(255,252,248,0.97)',
        borderRadius: 24, padding: '36px 40px',
        boxShadow: '0 24px 64px rgba(61,35,24,0.2)',
        border: '1px solid rgba(196,120,90,0.15)',
      }} onClick={e => e.stopPropagation()}>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontWeight: 400, fontSize: 22, color: '#3D2318', margin: '0 0 6px' }}>
          写一封情书
        </h2>
        <p style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: 13, color: 'rgba(61,35,24,0.4)', margin: '0 0 24px' }}>
          它会在你设定的日期送达 Ta 的手中
        </p>

        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="亲爱的 Ta，&#10;&#10;…"
          rows={10}
          style={{
            width: '100%', resize: 'none',
            padding: '16px 18px', borderRadius: 12,
            border: '1px solid rgba(196,120,90,0.2)',
            background: 'rgba(255,248,240,0.8)',
            fontSize: 14, color: '#3D2318', lineHeight: 1.8,
            fontFamily: "'DM Sans', sans-serif",
            outline: 'none',
          }}
          autoFocus
        />

        <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
          <label style={{ fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(196,120,90,0.65)', fontFamily: "'DM Sans', sans-serif", whiteSpace: 'nowrap' }}>
            送达日期
          </label>
          <input
            type="date"
            value={scheduledAt}
            min={dayjs().add(1, 'day').format('YYYY-MM-DD')}
            onChange={e => setScheduledAt(e.target.value)}
            style={{
              flex: 1, padding: '8px 12px', borderRadius: 8,
              border: '1px solid rgba(196,120,90,0.2)',
              background: 'rgba(255,255,255,0.8)',
              fontSize: 13, color: '#3D2318',
              fontFamily: "'DM Sans', sans-serif", outline: 'none',
            }}
          />
        </div>

        <div style={{ marginTop: 24, display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{
            padding: '10px 20px', borderRadius: 10, border: '1px solid rgba(196,120,90,0.2)',
            background: 'transparent', color: 'rgba(61,35,24,0.5)',
            fontSize: 13, fontFamily: "'DM Sans', sans-serif", cursor: 'pointer',
          }}>
            取消
          </button>
          <button onClick={handleSend} disabled={sending || !content.trim()} style={{
            padding: '10px 24px', borderRadius: 10, border: 'none',
            background: content.trim() ? 'linear-gradient(135deg, #C4785A, #E8849C)' : 'rgba(196,120,90,0.2)',
            color: '#fff', fontSize: 13, fontWeight: 500,
            fontFamily: "'DM Sans', sans-serif", cursor: content.trim() ? 'pointer' : 'not-allowed',
          }}>
            {sending ? '发送中…' : '封存寄出 ✉️'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── 阅读弹窗 ────────────────────────────────────────────────────────
function ReadLetterModal({ letter, onClose }: { letter: Letter; onClose: () => void }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(61,35,24,0.4)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
    }} onClick={onClose}>
      <div style={{
        width: '100%', maxWidth: 520,
        background: 'linear-gradient(160deg, #FFF8F0, #FFF3E8)',
        borderRadius: 24, padding: '40px 44px',
        boxShadow: '0 24px 64px rgba(61,35,24,0.2)',
        border: '1px solid rgba(196,120,90,0.2)',
        position: 'relative',
      }} onClick={e => e.stopPropagation()}>
        {/* 装饰线 */}
        <div style={{ position: 'absolute', top: 0, left: 44, right: 44, height: 2, background: 'linear-gradient(to right, transparent, rgba(196,120,90,0.3), transparent)' }} />

        <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 11, letterSpacing: '0.3em', textTransform: 'uppercase', color: 'rgba(196,120,90,0.6)', margin: '0 0 20px' }}>
          {dayjs(letter.scheduled_at).format('YYYY 年 MM 月 DD 日')}
        </p>
        <div style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 14, color: '#3D2318', lineHeight: 2,
          whiteSpace: 'pre-wrap',
          maxHeight: '60vh', overflowY: 'auto',
        }}>
          {letter.content}
        </div>
        <div style={{ marginTop: 28, textAlign: 'right' }}>
          <span style={{ fontFamily: "'Playfair Display', serif", fontStyle: 'italic', fontSize: 14, color: 'rgba(196,120,90,0.6)' }}>
            — 爱你的 Ta ♡
          </span>
        </div>
        <button onClick={onClose} style={{
          position: 'absolute', top: 20, right: 20,
          width: 28, height: 28, borderRadius: '50%',
          border: '1px solid rgba(196,120,90,0.2)',
          background: 'rgba(255,255,255,0.6)',
          color: 'rgba(61,35,24,0.4)', cursor: 'pointer',
          fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>×</button>
      </div>
    </div>
  )
}

// ── 日记条目 ────────────────────────────────────────────────────────
const VISIBILITY_CONFIG = {
  private: { label: '仅自己', color: 'rgba(61,35,24,0.4)', icon: '🔒' },
  shared:  { label: '共同可见', color: '#C4785A', icon: '💑' },
  partner: { label: 'Ta可见', color: '#E8849C', icon: '💌' },
}

function DiaryEntryCard({ entry, isMe, onDelete }: { entry: DiaryEntry; isMe: boolean; onDelete?: () => void }) {
  const vis = VISIBILITY_CONFIG[entry.visibility]
  return (
    <div style={{
      padding: '16px 18px', borderRadius: 14, marginBottom: 10,
      background: isMe ? 'rgba(196,120,90,0.05)' : 'rgba(232,132,156,0.05)',
      border: `1px solid ${isMe ? 'rgba(196,120,90,0.12)' : 'rgba(232,132,156,0.12)'}`,
      position: 'relative',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <span style={{ fontSize: 10, color: 'rgba(61,35,24,0.35)', fontFamily: "'DM Sans', sans-serif" }}>
          {dayjs(entry.created_at).format('MM/DD HH:mm')}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 10, color: vis.color, fontFamily: "'DM Sans', sans-serif" }}>
            {vis.icon} {vis.label}
          </span>
          {isMe && onDelete && (
            <button onClick={onDelete} style={{
              width: 18, height: 18, borderRadius: 4,
              border: 'none', background: 'transparent',
              color: 'rgba(61,35,24,0.25)', cursor: 'pointer', fontSize: 12,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>×</button>
          )}
        </div>
      </div>
      <p style={{ margin: 0, fontSize: 13, color: '#3D2318', lineHeight: 1.7, fontFamily: "'DM Sans', sans-serif", whiteSpace: 'pre-wrap' }}>
        {entry.content}
      </p>
    </div>
  )
}

// ── 主页面 ──────────────────────────────────────────────────────────
export default function LettersPage() {
  const { profile, partner } = useOnlyUsAuthStore()
  const { pendingLetters, receivedLetters, isLoading: lettersLoading, loadLetters, scheduleLetter, deleteLetter } = useLetterStore()
  const { myEntries, partnerEntries, isLoading: diaryLoading, loadDiaries, addDiary, deleteDiary } = useDiaryStore()

  const [tab, setTab] = useState<'letters' | 'diary'>('letters')
  const [showWrite, setShowWrite] = useState(false)
  const [readingLetter, setReadingLetter] = useState<Letter | null>(null)
  const [diaryContent, setDiaryContent] = useState('')
  const [diaryVisibility, setDiaryVisibility] = useState<DiaryVisibility>('private')
  const [savingDiary, setSavingDiary] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (!profile?.id || !partner?.id) return
    if (tab === 'letters') loadLetters(profile.id)
    else loadDiaries(profile.id, partner.id)
  }, [tab, profile?.id, partner?.id, loadLetters, loadDiaries])

  const handleSendLetter = async (content: string, date: string) => {
    if (!profile?.id || !partner?.id) return
    await scheduleLetter(profile.id, partner.id, content, date + 'T00:00:00Z')
  }

  const handleSaveDiary = async () => {
    if (!diaryContent.trim() || !profile?.id) return
    setSavingDiary(true)
    await addDiary(profile.id, diaryContent.trim(), diaryVisibility)
    setDiaryContent('')
    setSavingDiary(false)
  }

  const GlassCard = ({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) => (
    <div style={{
      background: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(16px)',
      borderRadius: 20, border: '1px solid rgba(196,120,90,0.1)',
      padding: '24px 28px', ...style,
    }}>
      {children}
    </div>
  )

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;1,400&family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&display=swap');
        @keyframes card-rise { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
        .letter-card { animation: card-rise 0.5s cubic-bezier(0.16,1,0.3,1) both; }
        textarea::placeholder { color: rgba(61,35,24,0.3); }
        textarea:focus { outline: none; }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-thumb { background: rgba(196,120,90,0.2); border-radius: 2px; }
      `}</style>

      <div style={{ minHeight: '100%', padding: '40px 40px 60px', maxWidth: 960, margin: '0 auto' }}>

        {/* 标题 + Tab */}
        <div className="letter-card" style={{ marginBottom: 28, animationDelay: '0ms', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 12, letterSpacing: '0.28em', textTransform: 'uppercase', color: 'rgba(196,120,90,0.6)', margin: '0 0 6px' }}>
              温柔留存
            </p>
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 400, color: '#3D2318', margin: 0 }}>
              {tab === 'letters' ? '情书' : '日记'}
            </h1>
          </div>

          {/* Tab 切换 */}
          <div style={{
            display: 'flex', gap: 2,
            background: 'rgba(196,120,90,0.08)', borderRadius: 12, padding: 3,
          }}>
            {(['letters', 'diary'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)} style={{
                padding: '7px 18px', borderRadius: 9, border: 'none',
                background: tab === t ? 'rgba(255,255,255,0.8)' : 'transparent',
                color: tab === t ? '#C4785A' : 'rgba(61,35,24,0.4)',
                fontSize: 12, fontFamily: "'DM Sans', sans-serif",
                fontWeight: tab === t ? 600 : 400,
                cursor: 'pointer', transition: 'all 0.15s',
                boxShadow: tab === t ? '0 1px 4px rgba(196,120,90,0.12)' : 'none',
              }}>
                {t === 'letters' ? '💌 情书' : '📝 日记'}
              </button>
            ))}
          </div>
        </div>

        {/* ── 情书 Tab ── */}
        {tab === 'letters' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

            {/* 左：待送出 */}
            <div className="letter-card" style={{ animationDelay: '60ms' }}>
              <GlassCard>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 11, letterSpacing: '0.3em', textTransform: 'uppercase', color: 'rgba(196,120,90,0.7)', margin: 0 }}>
                    待送出 · {pendingLetters.length}
                  </p>
                  <button onClick={() => setShowWrite(true)} style={{
                    padding: '6px 14px', borderRadius: 8, border: 'none',
                    background: 'linear-gradient(135deg, #C4785A, #E8849C)',
                    color: '#fff', fontSize: 11,
                    fontFamily: "'DM Sans', sans-serif", cursor: 'pointer',
                  }}>
                    + 写信
                  </button>
                </div>

                {lettersLoading ? (
                  <div style={{ textAlign: 'center', padding: '24px 0', color: 'rgba(61,35,24,0.3)', fontSize: 13 }}>加载中…</div>
                ) : pendingLetters.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '32px 0' }}>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>✉️</div>
                    <p style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: 13, color: 'rgba(61,35,24,0.3)', margin: 0 }}>
                      还没有待送出的情书
                    </p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 500, overflowY: 'auto' }}>
                    {pendingLetters.map(l => (
                      <div key={l.id} style={{ position: 'relative' }}>
                        <Envelope3D letter={l} onClick={() => {}} />
                        <button
                          onClick={() => deleteLetter(l.id)}
                          style={{
                            position: 'absolute', top: 8, right: 8,
                            width: 22, height: 22, borderRadius: 6,
                            border: 'none', background: 'rgba(61,35,24,0.08)',
                            color: 'rgba(61,35,24,0.35)', cursor: 'pointer',
                            fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}
                        >×</button>
                      </div>
                    ))}
                  </div>
                )}
              </GlassCard>
            </div>

            {/* 右：已收到 */}
            <div className="letter-card" style={{ animationDelay: '100ms' }}>
              <GlassCard>
                <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 11, letterSpacing: '0.3em', textTransform: 'uppercase', color: 'rgba(196,120,90,0.7)', margin: '0 0 20px' }}>
                  已收到 · {receivedLetters.length}
                </p>

                {receivedLetters.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '32px 0' }}>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>💌</div>
                    <p style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: 13, color: 'rgba(61,35,24,0.3)', margin: 0 }}>
                      Ta 还没有给你写信
                    </p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 500, overflowY: 'auto' }}>
                    {receivedLetters.map(l => (
                      <Envelope3D key={l.id} letter={l} onClick={() => setReadingLetter(l)} />
                    ))}
                  </div>
                )}
              </GlassCard>
            </div>
          </div>
        )}

        {/* ── 日记 Tab ── */}
        {tab === 'diary' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

            {/* 左：我的日记 */}
            <div className="letter-card" style={{ animationDelay: '60ms', display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* 写日记区域 */}
              <GlassCard>
                <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 11, letterSpacing: '0.3em', textTransform: 'uppercase', color: 'rgba(196,120,90,0.7)', margin: '0 0 14px' }}>
                  写下今天
                </p>
                <textarea
                  ref={textareaRef}
                  value={diaryContent}
                  onChange={e => setDiaryContent(e.target.value)}
                  placeholder="今天发生了什么？有什么想说的…"
                  rows={5}
                  style={{
                    width: '100%', resize: 'none',
                    padding: '12px 14px', borderRadius: 10,
                    border: '1px solid rgba(196,120,90,0.15)',
                    background: 'rgba(255,248,240,0.6)',
                    fontSize: 13, color: '#3D2318', lineHeight: 1.7,
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                />
                {/* 可见性选择 */}
                <div style={{ marginTop: 10, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {(Object.entries(VISIBILITY_CONFIG) as [DiaryVisibility, typeof VISIBILITY_CONFIG[DiaryVisibility]][]).map(([key, cfg]) => (
                    <button
                      key={key}
                      onClick={() => setDiaryVisibility(key)}
                      style={{
                        padding: '5px 12px', borderRadius: 20, border: 'none',
                        background: diaryVisibility === key ? 'rgba(196,120,90,0.12)' : 'rgba(0,0,0,0.04)',
                        color: diaryVisibility === key ? '#C4785A' : 'rgba(61,35,24,0.4)',
                        fontSize: 11, fontFamily: "'DM Sans', sans-serif",
                        cursor: 'pointer', transition: 'all 0.15s',
                        border: diaryVisibility === key ? '1px solid rgba(196,120,90,0.25)' : '1px solid transparent',
                      } as React.CSSProperties}
                    >
                      {cfg.icon} {cfg.label}
                    </button>
                  ))}
                  <button
                    onClick={handleSaveDiary}
                    disabled={savingDiary || !diaryContent.trim()}
                    style={{
                      marginLeft: 'auto', padding: '5px 16px', borderRadius: 20, border: 'none',
                      background: diaryContent.trim() ? 'linear-gradient(135deg, #C4785A, #E8849C)' : 'rgba(196,120,90,0.15)',
                      color: '#fff', fontSize: 11, fontFamily: "'DM Sans', sans-serif",
                      cursor: diaryContent.trim() ? 'pointer' : 'not-allowed',
                    }}
                  >
                    {savingDiary ? '保存中…' : '保存'}
                  </button>
                </div>
              </GlassCard>

              {/* 我的条目列表 */}
              <GlassCard>
                <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 11, letterSpacing: '0.3em', textTransform: 'uppercase', color: 'rgba(196,120,90,0.7)', margin: '0 0 14px' }}>
                  我的日记 · {myEntries.length}
                </p>
                <div style={{ maxHeight: 400, overflowY: 'auto' }}>
                  {myEntries.length === 0 ? (
                    <p style={{ textAlign: 'center', fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: 13, color: 'rgba(61,35,24,0.3)', padding: '20px 0' }}>
                      还没有日记记录
                    </p>
                  ) : myEntries.map(e => (
                    <DiaryEntryCard key={e.id} entry={e} isMe onDelete={() => deleteDiary(e.id)} />
                  ))}
                </div>
              </GlassCard>
            </div>

            {/* 右：对方日记 */}
            <div className="letter-card" style={{ animationDelay: '100ms' }}>
              <GlassCard style={{ height: '100%' }}>
                <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 11, letterSpacing: '0.3em', textTransform: 'uppercase', color: 'rgba(232,132,156,0.7)', margin: '0 0 14px' }}>
                  {partner?.nickname ?? 'Ta'} 的日记 · {partnerEntries.length}
                </p>
                <div style={{ maxHeight: 600, overflowY: 'auto' }}>
                  {diaryLoading ? (
                    <p style={{ textAlign: 'center', color: 'rgba(61,35,24,0.3)', fontSize: 13, padding: '20px 0' }}>加载中…</p>
                  ) : partnerEntries.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px 0' }}>
                      <div style={{ fontSize: 32, marginBottom: 8 }}>📖</div>
                      <p style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: 13, color: 'rgba(61,35,24,0.3)', margin: 0 }}>
                        Ta 还没有对你分享日记
                      </p>
                    </div>
                  ) : partnerEntries.map(e => (
                    <DiaryEntryCard key={e.id} entry={e} isMe={false} />
                  ))}
                </div>
              </GlassCard>
            </div>
          </div>
        )}
      </div>

      {/* 弹窗 */}
      {showWrite && <WriteLetterModal onClose={() => setShowWrite(false)} onSend={handleSendLetter} />}
      {readingLetter && <ReadLetterModal letter={readingLetter} onClose={() => setReadingLetter(null)} />}
    </>
  )
}
