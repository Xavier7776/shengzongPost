'use client'

import { useEffect, useState } from 'react'
import { useOnlyUsAuthStore } from '@/stores/onlyus/authStore'
import { useIsMobile } from '@/lib/hooks'
import { useExpenseStore, EXPENSE_CATEGORIES, type Expense } from '@/stores/onlyus/gameStores'
import dayjs from 'dayjs'

// ── 迷你环形图 ────────────────────────────────────────────────────────
function DonutChart({ data }: { data: { label: string; value: number; color: string }[] }) {
  const total = data.reduce((s, d) => s + d.value, 0)
  if (total === 0) return <div style={{ width: 120, height: 120, borderRadius: '50%', background: 'rgba(196,120,90,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: 'rgba(61,35,24,0.3)', fontFamily: "'DM Sans', sans-serif" }}>暂无数据</div>

  const R = 52, STROKE = 18, CIRC = 2 * Math.PI * R
  let offset = 0

  return (
    <svg width={140} height={140} viewBox="-70 -70 140 140">
      <circle cx="0" cy="0" r={R} fill="none" stroke="rgba(196,120,90,0.06)" strokeWidth={STROKE} />
      {data.filter(d => d.value > 0).map((d, i) => {
        const pct = d.value / total
        const dash = pct * CIRC
        const seg = (
          <circle key={i} cx="0" cy="0" r={R} fill="none"
            stroke={d.color} strokeWidth={STROKE}
            strokeDasharray={`${dash} ${CIRC}`}
            strokeDashoffset={-offset * CIRC / (2 * Math.PI * R) * CIRC + CIRC / 4}
            style={{ transition: 'stroke-dasharray 0.6s ease' }}
          />
        )
        offset += dash
        return seg
      })}
      <text textAnchor="middle" dy="0.35em" fontSize="11" fill="rgba(61,35,24,0.5)" fontFamily="'DM Sans', sans-serif">
        ¥{total.toFixed(0)}
      </text>
    </svg>
  )
}

// ── 添加账单弹窗 ──────────────────────────────────────────────────────
function AddExpenseModal({ onClose, coupleId, userId }: { onClose: () => void; coupleId: string; userId: string }) {
  const { addExpense } = useExpenseStore()
  const isMobile = useIsMobile()
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0].key)
  const [note, setNote] = useState('')
  const [date, setDate] = useState(dayjs().format('YYYY-MM-DD'))
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!amount || isNaN(Number(amount))) return
    setSaving(true)
    await addExpense({ couple_id: coupleId, user_id: userId, amount: Number(amount), category, note: note || null, expense_date: date })
    setSaving(false)
    onClose()
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(61,35,24,0.4)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: isMobile ? 12 : 24 }} onClick={onClose}>
      <div style={{ width: '100%', maxWidth: isMobile ? '100%' : 420, background: 'rgba(255,252,248,0.97)', borderRadius: isMobile ? 16 : 24, padding: isMobile ? '24px 20px' : '32px 36px', boxShadow: '0 24px 64px rgba(61,35,24,0.18)', border: '1px solid rgba(196,120,90,0.15)' }} onClick={e => e.stopPropagation()}>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontWeight: 400, fontSize: 20, color: '#3D2318', margin: '0 0 22px' }}>添加账单</h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* 金额 */}
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgba(61,35,24,0.4)', fontSize: 16, fontFamily: "'DM Sans', sans-serif" }}>¥</span>
            <input
              value={amount} onChange={e => setAmount(e.target.value)}
              placeholder="0.00" type="number" min="0" step="0.01"
              style={{ width: '100%', padding: '10px 14px 10px 30px', borderRadius: 10, border: '1px solid rgba(196,120,90,0.2)', background: 'rgba(255,255,255,0.7)', fontSize: 20, color: '#3D2318', fontFamily: "'DM Sans', sans-serif", outline: 'none', fontWeight: 600 }}
              autoFocus
            />
          </div>

          {/* 分类 */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {EXPENSE_CATEGORIES.map(cat => (
              <button key={cat.key} onClick={() => setCategory(cat.key)} style={{
                padding: '6px 12px', borderRadius: 20, cursor: 'pointer',
                background: category === cat.key ? 'rgba(196,120,90,0.12)' : 'rgba(0,0,0,0.04)',
                color: category === cat.key ? '#C4785A' : 'rgba(61,35,24,0.5)',
                fontSize: 12, fontFamily: "'DM Sans', sans-serif",
                border: category === cat.key ? '1px solid rgba(196,120,90,0.25)' : '1px solid transparent',
              } as React.CSSProperties}>
                {cat.emoji} {cat.key}
              </button>
            ))}
          </div>

          {/* 备注 */}
          <input value={note} onChange={e => setNote(e.target.value)} placeholder="备注（选填）" style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid rgba(196,120,90,0.2)', background: 'rgba(255,255,255,0.7)', fontSize: 13, color: '#3D2318', fontFamily: "'DM Sans', sans-serif", outline: 'none' }} />

          {/* 日期 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <label style={{ fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(196,120,90,0.65)', fontFamily: "'DM Sans', sans-serif', whiteSpace: 'nowrap" }}>日期</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(196,120,90,0.2)', background: 'rgba(255,255,255,0.7)', fontSize: 13, color: '#3D2318', fontFamily: "'DM Sans', sans-serif", outline: 'none' }} />
          </div>
        </div>

        <div style={{ marginTop: 22, display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '10px 20px', borderRadius: 10, border: '1px solid rgba(196,120,90,0.2)', background: 'transparent', color: 'rgba(61,35,24,0.5)', fontSize: 13, fontFamily: "'DM Sans', sans-serif", cursor: 'pointer' }}>取消</button>
          <button onClick={handleSave} disabled={saving || !amount} style={{ padding: '10px 22px', borderRadius: 10, border: 'none', background: amount ? 'linear-gradient(135deg, #C4785A, #E8849C)' : 'rgba(196,120,90,0.2)', color: '#fff', fontSize: 13, fontFamily: "'DM Sans', sans-serif", cursor: amount ? 'pointer' : 'not-allowed' }}>
            {saving ? '保存…' : '记录'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── 主页面 ──────────────────────────────────────────────────────────
const CAT_COLORS: Record<string, string> = {
  '交通': '#7EB8D4', '餐饮': '#F5A623', '礼物': '#E8849C',
  '住宿': '#7BB87E', '娱乐': '#9B7EB8', '其他': '#9CA3AF',
}

export default function ExpensePage() {
  const { profile, partner, coupleInfo } = useOnlyUsAuthStore()
  const isMobile = useIsMobile()
  const { expenses, isLoading, currentMonth, setCurrentMonth, loadExpenses, deleteExpense, subscribe, unsubscribe, getMonthTotal, getCategoryBreakdown, getPerPersonSplit } = useExpenseStore()
  const [showAdd, setShowAdd] = useState(false)

  const coupleId = coupleInfo?.id ?? ''
  const myId = profile?.id ?? ''

  useEffect(() => {
    if (!coupleId) return
    loadExpenses(coupleId)
    subscribe(coupleId)
    return () => unsubscribe()
  }, [coupleId, currentMonth, loadExpenses, subscribe, unsubscribe])

  const total = getMonthTotal()
  const breakdown = getCategoryBreakdown()
  const { myTotal, partnerTotal } = getPerPersonSplit(myId)
  const diff = myTotal - partnerTotal
  const donutData = Object.entries(breakdown).map(([cat, val]) => ({
    label: cat, value: val,
    color: CAT_COLORS[cat] ?? '#C4785A',
  }))

  const changeMonth = (delta: number) => {
    const d = dayjs(currentMonth + '-01').add(delta, 'month')
    setCurrentMonth(d.format('YYYY-MM'))
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;1,400&family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&display=swap');
        @keyframes card-rise { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
        input:focus { border-color: rgba(196,120,90,0.4) !important; outline: none; }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-thumb { background: rgba(196,120,90,0.2); border-radius: 2px; }
      `}</style>

      <div style={{ minHeight: '100%', padding: isMobile ? '20px 16px 80px' : '36px 40px 60px', maxWidth: 900, margin: '0 auto' }}>

        {/* 标题 + 月份切换 */}
        <div style={{ animation: 'card-rise 0.45s ease both', marginBottom: 24, display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'flex-end', gap: isMobile ? 12 : 0 }}>
          <div>
            <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 12, letterSpacing: '0.28em', textTransform: 'uppercase', color: 'rgba(196,120,90,0.6)', margin: '0 0 6px' }}>共同账单</p>
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 400, color: '#3D2318', margin: 0 }}>
              花费记录
            </h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={() => changeMonth(-1)} style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid rgba(196,120,90,0.2)', background: 'rgba(255,255,255,0.6)', color: 'rgba(61,35,24,0.5)', cursor: 'pointer', fontSize: 14 }}>‹</button>
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#3D2318', minWidth: 70, textAlign: 'center' }}>
              {dayjs(currentMonth + '-01').format('YYYY/MM')}
            </span>
            <button onClick={() => changeMonth(1)} style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid rgba(196,120,90,0.2)', background: 'rgba(255,255,255,0.6)', color: 'rgba(61,35,24,0.5)', cursor: 'pointer', fontSize: 14 }}>›</button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '240px 1fr', gap: 16, alignItems: 'start' }}>

          {/* 左侧统计 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* 环形图 */}
            <div style={{ background: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(16px)', borderRadius: 20, border: '1px solid rgba(196,120,90,0.1)', padding: '22px 20px', animation: 'card-rise 0.5s ease 0.05s both', textAlign: 'center' }}>
              <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 11, letterSpacing: '0.3em', textTransform: 'uppercase', color: 'rgba(196,120,90,0.7)', margin: '0 0 16px' }}>本月总计</p>
              <DonutChart data={donutData} />
              <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {Object.entries(breakdown).map(([cat, val]) => (
                  <div key={cat} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 8, height: 8, borderRadius: 2, background: CAT_COLORS[cat] ?? '#C4785A' }} />
                      <span style={{ fontSize: 11, color: 'rgba(61,35,24,0.55)', fontFamily: "'DM Sans', sans-serif" }}>{EXPENSE_CATEGORIES.find(c => c.key === cat)?.emoji} {cat}</span>
                    </div>
                    <span style={{ fontSize: 11, color: '#3D2318', fontFamily: "'DM Sans', sans-serif", fontWeight: 500 }}>¥{val.toFixed(0)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* AA 分析 */}
            <div style={{ background: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(16px)', borderRadius: 20, border: '1px solid rgba(196,120,90,0.1)', padding: '22px 20px', animation: 'card-rise 0.5s ease 0.1s both' }}>
              <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 11, letterSpacing: '0.3em', textTransform: 'uppercase', color: 'rgba(196,120,90,0.7)', margin: '0 0 14px' }}>谁花得多</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { name: profile?.nickname ?? 'Me', total: myTotal, color: '#C4785A' },
                  { name: partner?.nickname ?? 'Ta', total: partnerTotal, color: '#E8849C' },
                ].map(({ name, total: t, color }) => (
                  <div key={name}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 11, color: 'rgba(61,35,24,0.55)', fontFamily: "'DM Sans', sans-serif" }}>{name}</span>
                      <span style={{ fontSize: 12, color: '#3D2318', fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>¥{t.toFixed(0)}</span>
                    </div>
                    <div style={{ height: 4, borderRadius: 2, background: 'rgba(196,120,90,0.08)' }}>
                      <div style={{ height: '100%', borderRadius: 2, background: color, width: total > 0 ? `${(t / total * 100).toFixed(0)}%` : '0%', transition: 'width 0.6s ease' }} />
                    </div>
                  </div>
                ))}
              </div>
              {total > 0 && (
                <p style={{ marginTop: 12, fontSize: 11, color: diff > 0 ? '#C4785A' : '#E8849C', fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', textAlign: 'center' }}>
                  {Math.abs(diff) < 1 ? '刚好一样多 ✨' : `${diff > 0 ? (profile?.nickname ?? 'Me') : (partner?.nickname ?? 'Ta')} 多花了 ¥${Math.abs(diff).toFixed(0)}`}
                </p>
              )}
            </div>
          </div>

          {/* 右侧表格 */}
          <div style={{ background: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(16px)', borderRadius: 20, border: '1px solid rgba(196,120,90,0.1)', padding: '22px 24px', animation: 'card-rise 0.5s ease 0.08s both' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 11, letterSpacing: '0.3em', textTransform: 'uppercase', color: 'rgba(196,120,90,0.7)', margin: 0 }}>
                明细 · {expenses.length} 笔
              </p>
              <button onClick={() => setShowAdd(true)} style={{
                padding: '6px 14px', borderRadius: 8, border: 'none',
                background: 'linear-gradient(135deg, #C4785A, #E8849C)',
                color: '#fff', fontSize: 11, fontFamily: "'DM Sans', sans-serif", cursor: 'pointer',
              }}>
                + 记录
              </button>
            </div>

            {isLoading ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'rgba(61,35,24,0.35)', fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic' }}>加载中…</div>
            ) : expenses.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 0' }}>
                <div style={{ fontSize: 32, marginBottom: 10 }}>💰</div>
                <p style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: 14, color: 'rgba(61,35,24,0.3)', margin: 0 }}>
                  这个月还没有记录
                </p>
              </div>
            ) : (
              <div style={{ maxHeight: 520, overflowY: 'auto' }}>
                {isMobile ? (
                  /* 手机端：卡片布局 */
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {expenses.map(exp => {
                      const isMe = exp.user_id === myId
                      const cat = EXPENSE_CATEGORIES.find(c => c.key === exp.category)
                      return (
                        <div key={exp.id} style={{
                          padding: '12px 14px', borderRadius: 12,
                          background: 'rgba(255,255,255,0.5)',
                          border: '1px solid rgba(196,120,90,0.08)',
                          display: 'flex', alignItems: 'center', gap: 10,
                        }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ margin: 0, fontSize: 13, color: '#3D2318', fontFamily: "'DM Sans', sans-serif", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {cat?.emoji} {exp.note || exp.category}
                            </p>
                            <p style={{ margin: '2px 0 0', fontSize: 10, color: 'rgba(61,35,24,0.35)', fontFamily: "'DM Sans', sans-serif" }}>
                              {dayjs(exp.expense_date).format('MM/DD')} · {isMe ? (profile?.nickname ?? 'Me') : (partner?.nickname ?? 'Ta')}
                            </p>
                          </div>
                          <span style={{ fontSize: 14, color: '#3D2318', fontWeight: 600, fontFamily: "'DM Sans', sans-serif", flexShrink: 0 }}>
                            ¥{Number(exp.amount).toFixed(0)}
                          </span>
                          {exp.user_id === myId && (
                            <button onClick={() => deleteExpense(exp.id)} style={{ width: 24, height: 24, border: 'none', background: 'transparent', color: 'rgba(61,35,24,0.25)', cursor: 'pointer', fontSize: 14, borderRadius: 4, flexShrink: 0 }}>×</button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <>
                    {/* 桌面端：表格布局 */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 100px 72px 36px', gap: 8, padding: '6px 8px', marginBottom: 6 }}>
                      {['备注', '分类', '谁', '金额', ''].map((h, i) => (
                        <span key={i} style={{ fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(61,35,24,0.3)', fontFamily: "'DM Sans', sans-serif" }}>{h}</span>
                      ))}
                    </div>

                    {expenses.map(exp => {
                      const isMe = exp.user_id === myId
                      const cat = EXPENSE_CATEGORIES.find(c => c.key === exp.category)
                      return (
                        <div key={exp.id} style={{
                          display: 'grid', gridTemplateColumns: '1fr 80px 100px 72px 36px',
                          gap: 8, padding: '10px 8px',
                          borderBottom: '1px solid rgba(196,120,90,0.06)',
                          alignItems: 'center',
                        }}>
                          <div>
                            <p style={{ margin: 0, fontSize: 13, color: '#3D2318', fontFamily: "'DM Sans', sans-serif", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {exp.note || '—'}
                            </p>
                            <p style={{ margin: 0, fontSize: 10, color: 'rgba(61,35,24,0.35)', fontFamily: "'DM Sans', sans-serif" }}>
                              {dayjs(exp.expense_date).format('MM/DD')}
                            </p>
                          </div>
                          <span style={{ fontSize: 12, color: 'rgba(61,35,24,0.5)', fontFamily: "'DM Sans', sans-serif" }}>{cat?.emoji} {exp.category}</span>
                          <span style={{
                            fontSize: 11, fontFamily: "'DM Sans', sans-serif",
                            color: isMe ? '#C4785A' : '#E8849C',
                            background: isMe ? 'rgba(196,120,90,0.08)' : 'rgba(232,132,156,0.08)',
                            padding: '3px 8px', borderRadius: 6,
                          }}>
                            {isMe ? (profile?.nickname ?? 'Me') : (partner?.nickname ?? 'Ta')}
                          </span>
                          <span style={{ fontSize: 14, color: '#3D2318', fontWeight: 600, fontFamily: "'DM Sans', sans-serif", textAlign: 'right' }}>
                            ¥{Number(exp.amount).toFixed(0)}
                          </span>
                          {exp.user_id === myId && (
                            <button onClick={() => deleteExpense(exp.id)} style={{ width: 24, height: 24, border: 'none', background: 'transparent', color: 'rgba(61,35,24,0.25)', cursor: 'pointer', fontSize: 14, borderRadius: 4 }}>×</button>
                          )}
                          {exp.user_id !== myId && <div />}
                        </div>
                      )
                    })}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {showAdd && coupleId && myId && (
        <AddExpenseModal onClose={() => setShowAdd(false)} coupleId={coupleId} userId={myId} />
      )}
    </>
  )
}
