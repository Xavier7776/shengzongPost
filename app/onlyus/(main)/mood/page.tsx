'use client'

import { useState, useEffect, useRef } from 'react'
import { useOnlyUsAuthStore } from '@/stores/onlyus/authStore'
import { useMoodStore } from '@/stores/onlyus/moodStore'
import { useQuestionStore } from '@/stores/onlyus/utilStores'

// ── 心情定义 ──────────────────────────────────────────────────────────
const MOODS = [
  { key: 'loved',   emoji: '🥰', label: '幸福',  color: '#E8849C', bg: 'rgba(232,132,156,0.12)' },
  { key: 'happy',   emoji: '😊', label: '开心',  color: '#F5A623', bg: 'rgba(245,166,35,0.12)'  },
  { key: 'excited', emoji: '🤩', label: '兴奋',  color: '#FF6B6B', bg: 'rgba(255,107,107,0.12)' },
  { key: 'calm',    emoji: '😌', label: '平静',  color: '#7EB8D4', bg: 'rgba(126,184,212,0.12)' },
  { key: 'meh',     emoji: '😑', label: '一般',  color: '#9CA3AF', bg: 'rgba(156,163,175,0.12)' },
  { key: 'tired',   emoji: '😴', label: '疲惫',  color: '#A09BB0', bg: 'rgba(160,155,176,0.12)' },
  { key: 'anxious', emoji: '😰', label: '焦虑',  color: '#C4785A', bg: 'rgba(196,120,90,0.12)'  },
  { key: 'sad',     emoji: '😢', label: '难过',  color: '#6B9BD2', bg: 'rgba(107,155,210,0.12)' },
  { key: 'angry',   emoji: '😤', label: '生气',  color: '#D4584A', bg: 'rgba(212,88,74,0.12)'   },
]

// ── 3D Emoji 球（CSS 3D transform carousel）─────────────────────────
function EmojiSphere({
  selected, onSelect,
}: { selected: string | null; onSelect: (key: string) => void }) {
  const [rotation, setRotation] = useState(0)
  const [hovered, setHovered] = useState<string | null>(null)
  const dragStart = useRef<{ x: number; rot: number } | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const count = MOODS.length
  const radius = 110

  const handleMouseDown = (e: React.MouseEvent) => {
    dragStart.current = { x: e.clientX, rot: rotation }
  }
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragStart.current) return
    const delta = (e.clientX - dragStart.current.x) * 0.5
    setRotation(dragStart.current.rot + delta)
  }
  const handleMouseUp = () => { dragStart.current = null }

  return (
    <div
      ref={containerRef}
      style={{ position: 'relative', width: '100%', height: 280, cursor: 'grab' }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* 底部阴影 */}
      <div style={{
        position: 'absolute', bottom: 24, left: '50%',
        transform: 'translateX(-50%)',
        width: 180, height: 20, borderRadius: '50%',
        background: 'radial-gradient(ellipse, rgba(196,120,90,0.15), transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translateX(-50%) translateY(-50%)',
        width: 0, height: 0,
        transformStyle: 'preserve-3d',
        perspective: 800,
      }}>
        {MOODS.map((mood, i) => {
          const angle = (i / count) * 360 + rotation
          const rad = (angle * Math.PI) / 180
          const x = Math.sin(rad) * radius
          const z = Math.cos(rad) * radius
          // 根据z轴位置计算缩放和透明度（近大远小）
          const normalZ = (z + radius) / (radius * 2)
          const scale = 0.65 + normalZ * 0.55
          const opacity = 0.35 + normalZ * 0.65
          const isSelected = selected === mood.key

          return (
            <div
              key={mood.key}
              onClick={() => onSelect(mood.key)}
              onMouseEnter={() => setHovered(mood.key)}
              onMouseLeave={() => setHovered(null)}
              style={{
                position: 'absolute',
                transform: `translateX(${x}px) translateZ(${z}px)`,
                width: 64, height: 64,
                marginLeft: -32, marginTop: -32,
                borderRadius: '50%',
                background: isSelected ? mood.bg : 'rgba(255,255,255,0.5)',
                border: `2px solid ${isSelected ? mood.color : 'rgba(196,120,90,0.15)'}`,
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: 2,
                cursor: 'pointer',
                scale: String(scale),
                opacity: opacity,
                transition: 'border-color 0.15s, background 0.15s',
                backdropFilter: 'blur(8px)',
                boxShadow: isSelected ? `0 4px 16px ${mood.color}44` : 'none',
                zIndex: Math.round(normalZ * 10),
              }}
            >
              <span style={{ fontSize: hovered === mood.key ? 28 : 24, transition: 'font-size 0.15s' }}>
                {mood.emoji}
              </span>
              {scale > 0.9 && (
                <span style={{
                  fontSize: 9, color: isSelected ? mood.color : 'rgba(61,35,24,0.4)',
                  fontFamily: "'DM Sans', sans-serif", letterSpacing: '0.04em',
                }}>
                  {mood.label}
                </span>
              )}
            </div>
          )
        })}
      </div>

      {/* 拖动提示 */}
      <p style={{
        position: 'absolute', bottom: 4, left: '50%',
        transform: 'translateX(-50%)',
        fontSize: 10, color: 'rgba(61,35,24,0.25)',
        fontFamily: "'DM Sans', sans-serif",
        whiteSpace: 'nowrap', pointerEvents: 'none',
      }}>
        拖动旋转
      </p>
    </div>
  )
}

// ── 今日一题双栏 ───────────────────────────────────────────────────────
function QuestionSection() {
  const { profile, partner } = useOnlyUsAuthStore()
  const { todayQuestion, myAnswer, partnerAnswer, loadToday, submitAnswer } = useQuestionStore()
  const [draft, setDraft] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (profile?.id && partner?.id) loadToday(profile.id, partner.id)
  }, [profile?.id, partner?.id, loadToday])

  const handleSubmit = async () => {
    if (!draft.trim() || !profile?.id || !todayQuestion) return
    setSubmitting(true)
    await submitAnswer(todayQuestion.id, profile.id, draft.trim())
    setDraft('')
    setSubmitting(false)
  }

  if (!todayQuestion) return (
    <div style={{ textAlign: 'center', padding: '24px 0', color: 'rgba(61,35,24,0.35)', fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: 14 }}>
      今日暂无题目
    </div>
  )

  const myName = profile?.nickname ?? 'Me'
  const partnerName = partner?.nickname ?? 'Ta'

  return (
    <div>
      <p style={{
        fontSize: 15, color: '#3D2318', lineHeight: 1.6,
        fontFamily: "'Playfair Display', serif",
        fontStyle: 'italic', marginBottom: 20,
      }}>
        &ldquo;{todayQuestion.question_text}&rdquo;
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {/* 我的回答 */}
        <div style={{
          padding: '14px 16px', borderRadius: 14,
          background: 'rgba(196,120,90,0.06)',
          border: '1px solid rgba(196,120,90,0.12)',
        }}>
          <p style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(196,120,90,0.6)', margin: '0 0 8px', fontFamily: "'DM Sans', sans-serif" }}>
            {myName}
          </p>
          {myAnswer ? (
            <p style={{ fontSize: 13, color: '#3D2318', margin: 0, lineHeight: 1.6, fontFamily: "'DM Sans', sans-serif" }}>
              {myAnswer.answer}
            </p>
          ) : (
            <div>
              <textarea
                value={draft}
                onChange={e => setDraft(e.target.value)}
                placeholder="写下你的回答…"
                rows={3}
                style={{
                  width: '100%', resize: 'none',
                  background: 'transparent', border: 'none', outline: 'none',
                  fontSize: 13, color: '#3D2318', lineHeight: 1.6,
                  fontFamily: "'DM Sans', sans-serif",
                }}
              />
              <button
                onClick={handleSubmit}
                disabled={submitting || !draft.trim()}
                style={{
                  marginTop: 6, padding: '5px 14px',
                  borderRadius: 8, border: 'none',
                  background: draft.trim() ? '#C4785A' : 'rgba(196,120,90,0.2)',
                  color: '#fff', fontSize: 11,
                  fontFamily: "'DM Sans', sans-serif",
                  cursor: draft.trim() ? 'pointer' : 'not-allowed',
                }}
              >
                提交
              </button>
            </div>
          )}
        </div>

        {/* 对方回答 */}
        <div style={{
          padding: '14px 16px', borderRadius: 14,
          background: 'rgba(232,132,156,0.06)',
          border: '1px solid rgba(232,132,156,0.12)',
        }}>
          <p style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(232,132,156,0.6)', margin: '0 0 8px', fontFamily: "'DM Sans', sans-serif" }}>
            {partnerName}
          </p>
          {partnerAnswer ? (
            <p style={{ fontSize: 13, color: '#3D2318', margin: 0, lineHeight: 1.6, fontFamily: "'DM Sans', sans-serif" }}>
              {partnerAnswer.answer}
            </p>
          ) : (
            <p style={{
              fontSize: 12, color: 'rgba(61,35,24,0.3)', margin: 0,
              fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic',
            }}>
              {myAnswer ? '等 Ta 回答…' : '先写下你的回答'}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

// ── 趋势迷你图（7天心情折线）────────────────────────────────────────────
const MOOD_SCORE: Record<string, number> = {
  loved: 5, happy: 5, excited: 4, calm: 4, meh: 3,
  tired: 2, anxious: 2, sad: 1, angry: 1,
}
const DAYS = ['一', '二', '三', '四', '五', '六', '日']

// 生成模拟7天数据（真实项目中从 supabase 查询历史）
function useMoodHistory() {
  // 用 session 缓存，避免每次重渲染都随机
  const [data] = useState(() =>
    Array.from({ length: 7 }, (_, i) => {
      const moods = Object.keys(MOOD_SCORE)
      const m = moods[Math.floor(Math.random() * moods.length)]
      return { day: i, mood: m, score: MOOD_SCORE[m] }
    })
  )
  return data
}

function MoodTrendChart() {
  const history = useMoodHistory()
  const W = 280, H = 80, PAD = 10

  const scores = history.map(h => h.score)
  const min = 1, max = 5
  const pts = scores.map((s, i) => ({
    x: PAD + (i / (scores.length - 1)) * (W - PAD * 2),
    y: PAD + ((max - s) / (max - min)) * (H - PAD * 2),
  }))

  const pathD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
  const areaD = `${pathD} L ${pts[pts.length - 1].x} ${H} L ${pts[0].x} ${H} Z`

  return (
    <div>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow: 'visible' }}>
        <defs>
          <linearGradient id="trend-grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#C4785A" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#C4785A" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* 区域填充 */}
        <path d={areaD} fill="url(#trend-grad)" />
        {/* 折线 */}
        <path d={pathD} fill="none" stroke="#C4785A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {/* 数据点 */}
        {pts.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="3.5" fill="#C4785A" />
            <title>{MOODS.find(m => m.key === history[i].mood)?.emoji} {history[i].mood}</title>
          </g>
        ))}
      </svg>
      {/* X轴标签 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: PAD, paddingRight: PAD, marginTop: 4 }}>
        {history.map((h, i) => (
          <span key={i} style={{ fontSize: 9, color: 'rgba(61,35,24,0.3)', fontFamily: "'DM Sans', sans-serif" }}>
            {MOODS.find(m => m.key === h.mood)?.emoji}
          </span>
        ))}
      </div>
    </div>
  )
}

// ── 主页面 ──────────────────────────────────────────────────────────
export default function MoodPage() {
  const { profile, partner } = useOnlyUsAuthStore()
  const { myMood, partnerMood, myMoodText, loadMyMood, loadPartnerMood, saveMood, subscribeToPartner, unsubscribe } = useMoodStore()
  const [pendingMood, setPendingMood] = useState<string | null>(null)
  const [moodText, setMoodText] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (profile?.id) loadMyMood(profile.id)
    if (partner?.id) { loadPartnerMood(partner.id); subscribeToPartner(partner.id) }
    return () => unsubscribe()
  }, [profile?.id, partner?.id, loadMyMood, loadPartnerMood, subscribeToPartner, unsubscribe])

  useEffect(() => {
    if (myMood) setPendingMood(myMood)
    if (myMoodText) setMoodText(myMoodText)
  }, [myMood, myMoodText])

  const handleSave = async () => {
    if (!pendingMood || !profile?.id) return
    setSaving(true)
    await saveMood(profile.id, pendingMood, moodText)
    setSaving(false)
  }

  const selectedMoodInfo = MOODS.find(m => m.key === pendingMood)
  const partnerMoodInfo = MOODS.find(m => m.key === partnerMood)

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;1,400&family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&display=swap');
        @keyframes card-rise { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
        .mood-card { animation: card-rise 0.5s cubic-bezier(0.16,1,0.3,1) both; }
        textarea::placeholder { color: rgba(61,35,24,0.3); }
      `}</style>

      <div style={{ minHeight: '100%', padding: '40px 40px 60px', maxWidth: 900, margin: '0 auto' }}>

        {/* 标题 */}
        <div className="mood-card" style={{ marginBottom: 32, animationDelay: '0ms' }}>
          <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 12, letterSpacing: '0.28em', textTransform: 'uppercase', color: 'rgba(196,120,90,0.6)', margin: '0 0 6px' }}>
            {new Date().toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' })}
          </p>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 400, color: '#3D2318', margin: 0 }}>
            今天感觉怎么样？
          </h1>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 16 }}>
          {/* 左栏 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* 3D Emoji 球 */}
            <div className="mood-card" style={{
              animationDelay: '60ms',
              background: 'rgba(255,255,255,0.55)',
              backdropFilter: 'blur(16px)',
              borderRadius: 20,
              border: '1px solid rgba(196,120,90,0.1)',
              padding: '24px 28px',
            }}>
              <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 11, letterSpacing: '0.3em', textTransform: 'uppercase', color: 'rgba(196,120,90,0.7)', margin: '0 0 16px' }}>
                选择心情
              </p>
              <EmojiSphere selected={pendingMood} onSelect={setPendingMood} />

              {selectedMoodInfo && (
                <div style={{
                  marginTop: 8, display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 14px', borderRadius: 12,
                  background: selectedMoodInfo.bg,
                  border: `1px solid ${selectedMoodInfo.color}33`,
                }}>
                  <span style={{ fontSize: 22 }}>{selectedMoodInfo.emoji}</span>
                  <div>
                    <p style={{ margin: 0, fontSize: 14, color: selectedMoodInfo.color, fontFamily: "'DM Sans', sans-serif", fontWeight: 600 }}>
                      {selectedMoodInfo.label}
                    </p>
                  </div>
                </div>
              )}

              {pendingMood && (
                <div style={{ marginTop: 12 }}>
                  <textarea
                    value={moodText}
                    onChange={e => setMoodText(e.target.value)}
                    placeholder="说点什么吧（可选）…"
                    rows={2}
                    style={{
                      width: '100%', resize: 'none',
                      padding: '10px 14px', borderRadius: 10,
                      border: '1px solid rgba(196,120,90,0.15)',
                      background: 'rgba(255,255,255,0.6)',
                      fontSize: 13, color: '#3D2318', lineHeight: 1.6,
                      fontFamily: "'DM Sans', sans-serif",
                      outline: 'none',
                    }}
                  />
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    style={{
                      marginTop: 8, padding: '10px 24px',
                      borderRadius: 10, border: 'none',
                      background: 'linear-gradient(135deg, #C4785A, #E8849C)',
                      color: '#fff', fontSize: 13,
                      fontFamily: "'DM Sans', sans-serif",
                      fontWeight: 500, cursor: 'pointer',
                    }}
                  >
                    {saving ? '保存中…' : myMood ? '更新心情' : '记录心情'}
                  </button>
                </div>
              )}
            </div>

            {/* 今日一题 */}
            <div className="mood-card" style={{
              animationDelay: '120ms',
              background: 'rgba(255,255,255,0.55)',
              backdropFilter: 'blur(16px)',
              borderRadius: 20,
              border: '1px solid rgba(196,120,90,0.1)',
              padding: '24px 28px',
            }}>
              <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 11, letterSpacing: '0.3em', textTransform: 'uppercase', color: 'rgba(196,120,90,0.7)', margin: '0 0 16px' }}>
                每日一题
              </p>
              <QuestionSection />
            </div>
          </div>

          {/* 右栏 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* 对方今日心情 */}
            <div className="mood-card" style={{
              animationDelay: '80ms',
              background: 'rgba(255,255,255,0.55)',
              backdropFilter: 'blur(16px)',
              borderRadius: 20,
              border: '1px solid rgba(196,120,90,0.1)',
              padding: '24px 28px',
            }}>
              <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 11, letterSpacing: '0.3em', textTransform: 'uppercase', color: 'rgba(196,120,90,0.7)', margin: '0 0 16px' }}>
                {partner?.nickname ?? 'Ta'} 今天
              </p>

              {partnerMoodInfo ? (
                <div style={{ textAlign: 'center', padding: '8px 0' }}>
                  <div style={{ fontSize: 52, marginBottom: 8 }}>{partnerMoodInfo.emoji}</div>
                  <p style={{
                    fontSize: 16, color: partnerMoodInfo.color, margin: '0 0 6px',
                    fontFamily: "'Playfair Display', serif",
                  }}>
                    {partnerMoodInfo.label}
                  </p>
                  <p style={{ fontSize: 12, color: 'rgba(61,35,24,0.4)', margin: 0, fontFamily: "'DM Sans', sans-serif" }}>
                    刚刚更新
                  </p>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '16px 0', color: 'rgba(61,35,24,0.3)' }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>🌫️</div>
                  <p style={{ fontSize: 12, fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', margin: 0 }}>
                    Ta 还没有记录今天的心情
                  </p>
                </div>
              )}
            </div>

            {/* 近7天趋势 */}
            <div className="mood-card" style={{
              animationDelay: '140ms',
              background: 'rgba(255,255,255,0.55)',
              backdropFilter: 'blur(16px)',
              borderRadius: 20,
              border: '1px solid rgba(196,120,90,0.1)',
              padding: '24px 28px',
            }}>
              <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 11, letterSpacing: '0.3em', textTransform: 'uppercase', color: 'rgba(196,120,90,0.7)', margin: '0 0 16px' }}>
                我的近7天
              </p>
              <MoodTrendChart />
              <p style={{ marginTop: 6, fontSize: 10, color: 'rgba(61,35,24,0.25)', fontFamily: "'DM Sans', sans-serif", textAlign: 'center' }}>
                * 趋势图待接真实历史数据
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
