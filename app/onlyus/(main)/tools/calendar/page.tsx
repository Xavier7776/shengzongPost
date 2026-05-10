'use client'

import { useEffect, useState } from 'react'
import { useOnlyUsAuthStore } from '@/stores/onlyus/authStore'
import { useCalendarStore, type CalendarEvent } from '@/stores/onlyus/utilStores'
import dayjs, { type Dayjs } from 'dayjs'

const EVENT_COLORS = ['#C4785A','#E8849C','#F5A623','#7EB8D4','#7BB87E','#9B7EB8']
const WEEKDAYS = ['日','一','二','三','四','五','六']

// ── 添加事件弹窗 ──────────────────────────────────────────────────────
function AddEventModal({ defaultDate, coupleId, userId, onClose, onSave }: {
  defaultDate: string; coupleId: string; userId: string
  onClose: () => void
  onSave: (e: Omit<CalendarEvent, 'id' | 'created_at'>) => Promise<void>
}) {
  const [title, setTitle] = useState('')
  const [date, setDate] = useState(defaultDate)
  const [endDate, setEndDate] = useState(defaultDate)
  const [note, setNote] = useState('')
  const [color, setColor] = useState(EVENT_COLORS[0])
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!title.trim()) return
    setSaving(true)
    await onSave({ couple_id: coupleId, created_by: userId, title: title.trim(), date, end_date: endDate || date, note: note || null, color })
    setSaving(false)
    onClose()
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(61,35,24,0.4)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }} onClick={onClose}>
      <div style={{ width: '100%', maxWidth: 420, background: 'rgba(255,252,248,0.97)', borderRadius: 24, padding: '32px 36px', boxShadow: '0 24px 64px rgba(61,35,24,0.18)', border: '1px solid rgba(196,120,90,0.15)' }} onClick={e => e.stopPropagation()}>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontWeight: 400, fontSize: 20, color: '#3D2318', margin: '0 0 20px' }}>添加日程</h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="日程名称" autoFocus style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid rgba(196,120,90,0.2)', background: 'rgba(255,255,255,0.7)', fontSize: 14, color: '#3D2318', fontFamily: "'DM Sans', sans-serif", outline: 'none' }} />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(196,120,90,0.6)', fontFamily: "'DM Sans', sans-serif", display: 'block', marginBottom: 5 }}>开始</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ width: '100%', padding: '8px 12px', borderRadius: 9, border: '1px solid rgba(196,120,90,0.2)', background: 'rgba(255,255,255,0.7)', fontSize: 13, color: '#3D2318', fontFamily: "'DM Sans', sans-serif", outline: 'none' }} />
            </div>
            <div>
              <label style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(196,120,90,0.6)', fontFamily: "'DM Sans', sans-serif", display: 'block', marginBottom: 5 }}>结束</label>
              <input type="date" value={endDate} min={date} onChange={e => setEndDate(e.target.value)} style={{ width: '100%', padding: '8px 12px', borderRadius: 9, border: '1px solid rgba(196,120,90,0.2)', background: 'rgba(255,255,255,0.7)', fontSize: 13, color: '#3D2318', fontFamily: "'DM Sans', sans-serif", outline: 'none' }} />
            </div>
          </div>

          {/* 颜色 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <label style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(196,120,90,0.6)', fontFamily: "'DM Sans', sans-serif" }}>颜色</label>
            <div style={{ display: 'flex', gap: 6 }}>
              {EVENT_COLORS.map(c => (
                <button key={c} onClick={() => setColor(c)} style={{ width: 22, height: 22, borderRadius: '50%', border: c === color ? '2.5px solid rgba(61,35,24,0.5)' : '2.5px solid transparent', background: c, cursor: 'pointer', padding: 0 }} />
              ))}
            </div>
          </div>

          <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="备注（选填）" rows={2} style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid rgba(196,120,90,0.2)', background: 'rgba(255,255,255,0.7)', fontSize: 13, color: '#3D2318', fontFamily: "'DM Sans', sans-serif", outline: 'none', resize: 'none' }} />
        </div>

        <div style={{ marginTop: 22, display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '10px 20px', borderRadius: 10, border: '1px solid rgba(196,120,90,0.2)', background: 'transparent', color: 'rgba(61,35,24,0.5)', fontSize: 13, fontFamily: "'DM Sans', sans-serif", cursor: 'pointer' }}>取消</button>
          <button onClick={handleSave} disabled={saving || !title.trim()} style={{ padding: '10px 22px', borderRadius: 10, border: 'none', background: title.trim() ? 'linear-gradient(135deg, #C4785A, #E8849C)' : 'rgba(196,120,90,0.2)', color: '#fff', fontSize: 13, fontFamily: "'DM Sans', sans-serif", cursor: title.trim() ? 'pointer' : 'not-allowed' }}>
            {saving ? '保存…' : '添加'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── 主页面 ──────────────────────────────────────────────────────────
export default function CalendarPage() {
  const { profile, partner, coupleInfo } = useOnlyUsAuthStore()
  const { events, isLoading, loadEvents, addEvent, deleteEvent } = useCalendarStore()
  const [currentMonth, setCurrentMonth] = useState(dayjs())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [hoveredEvent, setHoveredEvent] = useState<string | null>(null)

  const coupleId = coupleInfo?.id ?? ''

  useEffect(() => {
    if (coupleId) loadEvents(coupleId)
  }, [coupleId, loadEvents])

  // 构建当月格子
  const startOfMonth = currentMonth.startOf('month')
  const endOfMonth = currentMonth.endOf('month')
  const startPad = startOfMonth.day() // 0=Sun
  const totalDays = endOfMonth.date()
  const cells: (Dayjs | null)[] = [
    ...Array.from({ length: startPad }, () => null),
    ...Array.from({ length: totalDays }, (_, i) => startOfMonth.add(i, 'day')),
  ]
  // 补到6行
  while (cells.length % 7 !== 0) cells.push(null)

  const getEventsForDate = (d: Dayjs) => {
    const ds = d.format('YYYY-MM-DD')
    return events.filter(e => ds >= e.date && ds <= (e.end_date ?? e.date))
  }

  const today = dayjs().format('YYYY-MM-DD')
  const selectedEvents = selectedDate ? events.filter(e => selectedDate >= e.date && selectedDate <= (e.end_date ?? e.date)) : []

  const handleAddEvent = async (e: Omit<CalendarEvent, 'id' | 'created_at'>) => {
    await addEvent(e)
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;1,400&family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&display=swap');
        @keyframes card-rise { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
        @keyframes slide-in { from { opacity:0; transform:translateX(12px); } to { opacity:1; transform:translateX(0); } }
        .cal-day:hover { background: rgba(196,120,90,0.06) !important; }
      `}</style>

      <div style={{ minHeight: '100%', padding: '32px 40px 60px', maxWidth: 900, margin: '0 auto' }}>

        {/* 标题 */}
        <div style={{ animation: 'card-rise 0.45s ease both', marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 12, letterSpacing: '0.28em', textTransform: 'uppercase', color: 'rgba(196,120,90,0.6)', margin: '0 0 6px' }}>共享日历</p>
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 400, color: '#3D2318', margin: 0 }}>
              {currentMonth.format('YYYY 年 M 月')}
            </h1>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setCurrentMonth(m => m.subtract(1, 'month'))} style={{ width: 34, height: 34, borderRadius: 9, border: '1px solid rgba(196,120,90,0.2)', background: 'rgba(255,255,255,0.6)', color: 'rgba(61,35,24,0.5)', cursor: 'pointer', fontSize: 16 }}>‹</button>
            <button onClick={() => setCurrentMonth(dayjs())} style={{ padding: '0 12px', height: 34, borderRadius: 9, border: '1px solid rgba(196,120,90,0.2)', background: 'rgba(255,255,255,0.6)', color: 'rgba(196,120,90,0.7)', cursor: 'pointer', fontSize: 11, fontFamily: "'DM Sans', sans-serif" }}>今天</button>
            <button onClick={() => setCurrentMonth(m => m.add(1, 'month'))} style={{ width: 34, height: 34, borderRadius: 9, border: '1px solid rgba(196,120,90,0.2)', background: 'rgba(255,255,255,0.6)', color: 'rgba(61,35,24,0.5)', cursor: 'pointer', fontSize: 16 }}>›</button>
            <button onClick={() => { setSelectedDate(dayjs().format('YYYY-MM-DD')); setShowAdd(true) }} style={{ padding: '0 16px', height: 34, borderRadius: 9, border: 'none', background: 'linear-gradient(135deg, #C4785A, #E8849C)', color: '#fff', fontSize: 11, fontFamily: "'DM Sans', sans-serif", cursor: 'pointer' }}>+ 添加</button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 260px', gap: 16, alignItems: 'start' }}>

          {/* 日历格 */}
          <div style={{
            background: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(16px)',
            borderRadius: 20, border: '1px solid rgba(196,120,90,0.1)',
            padding: '20px', animation: 'card-rise 0.5s ease 0.05s both',
          }}>
            {/* 星期标题 */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 8 }}>
              {WEEKDAYS.map(d => (
                <div key={d} style={{ textAlign: 'center', fontSize: 11, color: 'rgba(61,35,24,0.35)', fontFamily: "'DM Sans', sans-serif", letterSpacing: '0.05em', padding: '4px 0' }}>{d}</div>
              ))}
            </div>

            {/* 格子 */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
              {cells.map((day, i) => {
                if (!day) return <div key={i} />
                const ds = day.format('YYYY-MM-DD')
                const isToday = ds === today
                const isSelected = ds === selectedDate
                const dayEvents = getEventsForDate(day)
                const isCurrentMonth = day.month() === currentMonth.month()

                return (
                  <div
                    key={i}
                    className="cal-day"
                    onClick={() => setSelectedDate(ds)}
                    style={{
                      borderRadius: 10, padding: '6px 4px',
                      minHeight: 64, cursor: 'pointer',
                      background: isSelected
                        ? 'rgba(196,120,90,0.1)'
                        : isToday
                          ? 'rgba(232,132,156,0.08)'
                          : 'transparent',
                      border: isSelected
                        ? '1.5px solid rgba(196,120,90,0.3)'
                        : isToday
                          ? '1px solid rgba(232,132,156,0.25)'
                          : '1px solid transparent',
                      transition: 'all 0.12s ease',
                      opacity: isCurrentMonth ? 1 : 0.3,
                    }}
                  >
                    <div style={{
                      width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: isToday ? '#E8849C' : 'transparent',
                      color: isToday ? '#fff' : 'rgba(61,35,24,0.7)',
                      fontSize: 12, fontFamily: "'DM Sans', sans-serif", fontWeight: isToday ? 600 : 400,
                      marginBottom: 3,
                    }}>
                      {day.date()}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {dayEvents.slice(0, 3).map(ev => (
                        <div key={ev.id} style={{
                          height: 4, borderRadius: 2,
                          background: ev.color ?? '#C4785A',
                          opacity: 0.8,
                        }} />
                      ))}
                      {dayEvents.length > 3 && (
                        <span style={{ fontSize: 8, color: 'rgba(61,35,24,0.4)', fontFamily: "'DM Sans', sans-serif" }}>
                          +{dayEvents.length - 3}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* 右侧：选中日期事件 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{
              background: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(16px)',
              borderRadius: 20, border: '1px solid rgba(196,120,90,0.1)',
              padding: '20px 18px',
              animation: 'card-rise 0.5s ease 0.1s both',
              minHeight: 200,
            }}>
              {selectedDate ? (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                    <div>
                      <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 11, letterSpacing: '0.3em', textTransform: 'uppercase', color: 'rgba(196,120,90,0.7)', margin: '0 0 3px' }}>
                        {dayjs(selectedDate).format('M 月 D 日')}
                      </p>
                      <p style={{ fontSize: 11, color: 'rgba(61,35,24,0.4)', fontFamily: "'DM Sans', sans-serif", margin: 0 }}>
                        {dayjs(selectedDate).format('dddd')}
                      </p>
                    </div>
                    <button onClick={() => setShowAdd(true)} style={{
                      width: 28, height: 28, borderRadius: 7, border: 'none',
                      background: 'linear-gradient(135deg, #C4785A, #E8849C)',
                      color: '#fff', fontSize: 16, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>+</button>
                  </div>

                  {selectedEvents.length === 0 ? (
                    <p style={{ fontSize: 12, color: 'rgba(61,35,24,0.3)', fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', textAlign: 'center', padding: '20px 0' }}>
                      这天还没有日程
                    </p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, animation: 'slide-in 0.25s ease' }}>
                      {selectedEvents.map(ev => {
                        const isMe = ev.created_by === profile?.id
                        return (
                          <div
                            key={ev.id}
                            onMouseEnter={() => setHoveredEvent(ev.id)}
                            onMouseLeave={() => setHoveredEvent(null)}
                            style={{
                              padding: '10px 12px', borderRadius: 12,
                              background: `${ev.color ?? '#C4785A'}12`,
                              border: `1px solid ${ev.color ?? '#C4785A'}25`,
                              position: 'relative', cursor: 'default',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                              <div style={{ width: 3, height: 'auto', alignSelf: 'stretch', borderRadius: 2, background: ev.color ?? '#C4785A', flexShrink: 0 }} />
                              <div style={{ flex: 1 }}>
                                <p style={{ margin: '0 0 3px', fontSize: 13, color: '#3D2318', fontFamily: "'DM Sans', sans-serif", fontWeight: 500 }}>
                                  {ev.title}
                                </p>
                                {ev.note && <p style={{ margin: '0 0 4px', fontSize: 11, color: 'rgba(61,35,24,0.5)', fontFamily: "'DM Sans', sans-serif", lineHeight: 1.5 }}>{ev.note}</p>}
                                <p style={{ margin: 0, fontSize: 10, color: ev.color ?? '#C4785A', fontFamily: "'DM Sans', sans-serif" }}>
                                  {isMe ? (profile?.nickname ?? 'Me') : (partner?.nickname ?? 'Ta')} 创建
                                  {ev.date !== ev.end_date ? ` · 至 ${dayjs(ev.end_date).format('M/D')}` : ''}
                                </p>
                              </div>
                              {hoveredEvent === ev.id && isMe && (
                                <button onClick={() => deleteEvent(ev.id)} style={{ width: 20, height: 20, border: 'none', background: 'transparent', color: 'rgba(61,35,24,0.3)', cursor: 'pointer', fontSize: 14, flexShrink: 0 }}>×</button>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '32px 0' }}>
                  <p style={{ fontSize: 32, marginBottom: 8 }}>📅</p>
                  <p style={{ fontSize: 12, color: 'rgba(61,35,24,0.3)', fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', margin: 0 }}>
                    点击日期查看日程
                  </p>
                </div>
              )}
            </div>

            {/* 近期事件速览 */}
            <div style={{
              background: 'rgba(255,255,255,0.45)', backdropFilter: 'blur(12px)',
              borderRadius: 16, border: '1px solid rgba(196,120,90,0.08)',
              padding: '16px 16px',
              animation: 'card-rise 0.5s ease 0.14s both',
            }}>
              <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 10, letterSpacing: '0.25em', textTransform: 'uppercase', color: 'rgba(196,120,90,0.6)', margin: '0 0 10px' }}>
                近期日程
              </p>
              {events
                .filter(e => e.date >= today)
                .sort((a, b) => a.date.localeCompare(b.date))
                .slice(0, 4)
                .map(ev => (
                  <div key={ev.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', flexShrink: 0, background: ev.color ?? '#C4785A' }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: 11, color: '#3D2318', fontFamily: "'DM Sans', sans-serif", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ev.title}</p>
                    </div>
                    <span style={{ fontSize: 10, color: 'rgba(61,35,24,0.35)', fontFamily: "'DM Sans', sans-serif", whiteSpace: 'nowrap', flexShrink: 0 }}>
                      {dayjs(ev.date).format('M/D')}
                    </span>
                  </div>
                ))}
              {events.filter(e => e.date >= today).length === 0 && (
                <p style={{ fontSize: 11, color: 'rgba(61,35,24,0.3)', fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', margin: 0 }}>暂无近期日程</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {showAdd && coupleId && profile?.id && (
        <AddEventModal
          defaultDate={selectedDate ?? today}
          coupleId={coupleId}
          userId={profile.id}
          onClose={() => setShowAdd(false)}
          onSave={handleAddEvent}
        />
      )}
    </>
  )
}
