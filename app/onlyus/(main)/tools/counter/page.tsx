'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useOnlyUsAuthStore } from '@/stores/onlyus/authStore'
import { useIsMobile } from '@/lib/hooks'
import { getSupabaseClient } from '@/lib/supabase-client'
import type { RealtimeChannel } from '@supabase/supabase-js'

interface Counter {
  id: string
  couple_id: string
  label: string
  count: number
  updated_by: string
  updated_at: string
}

interface FloatNum {
  id: number
  value: number
  x: number
  y: number
}

function CounterCard({
  counter, myId, partnerName, myName,
  onUpdate,
}: {
  counter: Counter
  myId: string
  myName: string
  partnerName: string
  onUpdate: (id: string, delta: number) => void
}) {
  const [floats, setFloats] = useState<FloatNum[]>([])
  const [combo, setCombo] = useState(0)
  const comboTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const floatId = useRef(0)

  const triggerFloat = useCallback((delta: number) => {
    const id = floatId.current++
    const x = 40 + Math.random() * 60
    const y = 50 + Math.random() * 20
    setFloats(f => [...f, { id, value: delta, x, y }])
    setTimeout(() => setFloats(f => f.filter(ff => ff.id !== id)), 900)

    setCombo(c => {
      const next = c + 1
      if (comboTimer.current) clearTimeout(comboTimer.current)
      comboTimer.current = setTimeout(() => setCombo(0), 1200)
      return next
    })
  }, [])

  const lastUpdatedBy = counter.updated_by === myId ? myName : partnerName

  return (
    <div style={{
      background: 'rgba(255,255,255,0.55)',
      backdropFilter: 'blur(16px)',
      borderRadius: 20,
      border: '1px solid rgba(196,120,90,0.12)',
      padding: '28px 28px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* 浮动数字 */}
      {floats.map(f => (
        <div key={f.id} style={{
          position: 'absolute',
          left: `${f.x}%`, top: `${f.y}%`,
          color: f.value > 0 ? '#C4785A' : '#E8849C',
          fontSize: 18, fontWeight: 700,
          fontFamily: "'DM Sans', sans-serif",
          pointerEvents: 'none', zIndex: 10,
          animation: 'float-up 0.9s cubic-bezier(0.2,0,0.8,1) forwards',
        }}>
          {f.value > 0 ? '+' : ''}{f.value}
        </div>
      ))}

      {/* 连击提示 */}
      {combo >= 3 && (
        <div style={{
          position: 'absolute', top: 14, right: 14,
          background: 'linear-gradient(135deg, #C4785A, #E8849C)',
          color: '#fff', borderRadius: 20,
          padding: '3px 10px', fontSize: 10,
          fontFamily: "'DM Sans', sans-serif", fontWeight: 700,
          letterSpacing: '0.08em',
          animation: 'combo-bounce 0.15s ease',
        }}>
          {combo}x COMBO
        </div>
      )}

      <p style={{
        fontFamily: "'Cormorant Garamond', serif",
        fontSize: 11, letterSpacing: '0.3em', textTransform: 'uppercase',
        color: 'rgba(196,120,90,0.7)', margin: '0 0 16px',
      }}>
        {counter.label}
      </p>

      {/* 大数字 */}
      <div style={{
        fontFamily: "'Playfair Display', serif",
        fontSize: 72, fontWeight: 400, color: '#3D2318',
        lineHeight: 1, textAlign: 'center', marginBottom: 20,
        transition: 'transform 0.08s ease',
      }}>
        {counter.count.toLocaleString()}
      </div>

      {/* +/- 按钮 */}
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
        {[-1, +1].map(delta => (
          <button
            key={delta}
            onClick={() => {
              triggerFloat(delta)
              onUpdate(counter.id, delta)
            }}
            style={{
              width: 52, height: 52, borderRadius: '50%', border: 'none',
              background: delta > 0
                ? 'linear-gradient(135deg, #C4785A, #E8849C)'
                : 'rgba(196,120,90,0.1)',
              color: delta > 0 ? '#fff' : '#C4785A',
              fontSize: 22, cursor: 'pointer',
              boxShadow: delta > 0 ? '0 4px 16px rgba(196,120,90,0.3)' : 'none',
              transition: 'transform 0.1s ease, box-shadow 0.1s ease',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
            onMouseDown={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(0.9)' }}
            onMouseUp={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)' }}
          >
            {delta > 0 ? '+' : '−'}
          </button>
        ))}
      </div>

      <p style={{
        marginTop: 14, fontSize: 10,
        color: 'rgba(61,35,24,0.3)', fontFamily: "'DM Sans', sans-serif",
        textAlign: 'center',
      }}>
        上次：{lastUpdatedBy}
      </p>
    </div>
  )
}

export default function CounterPage() {
  const { profile, partner, coupleInfo } = useOnlyUsAuthStore()
  const isMobile = useIsMobile()
  const [counters, setCounters] = useState<Counter[]>([])
  const [loading, setLoading] = useState(true)
  const [newLabel, setNewLabel] = useState('')
  const channelRef = useRef<RealtimeChannel | null>(null)
  const coupleId = coupleInfo?.id ?? ''
  const myId = profile?.id ?? ''

  const load = useCallback(async () => {
    if (!coupleId) return
    const s = getSupabaseClient()
    const { data } = await s.from('counters').select('*').eq('couple_id', coupleId).order('created_at')
    setCounters((data as Counter[]) || [])
    setLoading(false)
  }, [coupleId])

  useEffect(() => {
    load()
    if (!coupleId) return
    const s = getSupabaseClient()
    const ch = s.channel(`counters-web-${coupleId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'counters', filter: `couple_id=eq.${coupleId}` }, () => load())
      .subscribe()
    channelRef.current = ch
    return () => { s.removeChannel(ch) }
  }, [coupleId, load])

  const handleUpdate = async (id: string, delta: number) => {
    if (!myId) return
    const s = getSupabaseClient()
    const counter = counters.find(c => c.id === id)
    if (!counter) return
    const newCount = counter.count + delta
    // 乐观更新
    setCounters(cs => cs.map(c => c.id === id ? { ...c, count: newCount, updated_by: myId } : c))
    await s.from('counters').update({ count: newCount, updated_by: myId, updated_at: new Date().toISOString() }).eq('id', id)
  }

  const handleAdd = async () => {
    if (!newLabel.trim() || !coupleId || !myId) return
    const s = getSupabaseClient()
    await s.from('counters').insert({ couple_id: coupleId, label: newLabel.trim(), count: 0, updated_by: myId })
    setNewLabel('')
  }

  const handleDelete = async (id: string) => {
    const s = getSupabaseClient()
    await s.from('counters').delete().eq('id', id)
    setCounters(cs => cs.filter(c => c.id !== id))
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;1,400&family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&display=swap');
        @keyframes float-up { from { opacity:1; transform:translateY(0) scale(1); } to { opacity:0; transform:translateY(-40px) scale(0.8); } }
        @keyframes combo-bounce { from { transform:scale(0.8); } to { transform:scale(1); } }
        @keyframes card-rise { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
        input:focus { border-color: rgba(196,120,90,0.4) !important; outline: none; }
      `}</style>

      <div style={{ minHeight: '100%', padding: isMobile ? '20px 16px 80px' : '36px 40px 60px', maxWidth: 860, margin: '0 auto' }}>
        <div style={{ animation: 'card-rise 0.45s ease both', marginBottom: 28 }}>
          <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 12, letterSpacing: '0.28em', textTransform: 'uppercase', color: 'rgba(196,120,90,0.6)', margin: '0 0 6px' }}>实时同步</p>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 400, color: '#3D2318', margin: 0 }}>计数器</h1>
        </div>

        {/* 添加新计数器 */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24, animation: 'card-rise 0.45s ease 0.05s both' }}>
          <input
            value={newLabel}
            onChange={e => setNewLabel(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            placeholder="新建计数器（如：亲亲次数）"
            style={{
              flex: 1, padding: '10px 16px', borderRadius: 12,
              border: '1px solid rgba(196,120,90,0.18)',
              background: 'rgba(255,255,255,0.6)',
              fontSize: 13, color: '#3D2318',
              fontFamily: "'DM Sans', sans-serif",
              backdropFilter: 'blur(8px)',
            }}
          />
          <button onClick={handleAdd} disabled={!newLabel.trim()} style={{
            padding: '10px 20px', borderRadius: 12, border: 'none',
            background: newLabel.trim() ? 'linear-gradient(135deg, #C4785A, #E8849C)' : 'rgba(196,120,90,0.15)',
            color: '#fff', fontSize: 13, fontFamily: "'DM Sans', sans-serif",
            cursor: newLabel.trim() ? 'pointer' : 'not-allowed',
          }}>
            创建
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'rgba(61,35,24,0.35)', fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic' }}>
            连接中…
          </div>
        ) : counters.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0', animation: 'card-rise 0.5s ease both' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🔢</div>
            <p style={{ fontFamily: "'Playfair Display', serif", fontStyle: 'italic', fontSize: 15, color: 'rgba(61,35,24,0.35)', margin: '0 0 6px' }}>
              还没有计数器
            </p>
            <p style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: 12, color: 'rgba(61,35,24,0.25)', margin: 0 }}>
              创建第一个，记录你们专属的数字吧
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>
            {counters.map((c, i) => (
              <div key={c.id} style={{ position: 'relative', animation: `card-rise 0.5s ease ${i * 60}ms both` }}>
                <CounterCard
                  counter={c}
                  myId={myId}
                  myName={profile?.nickname ?? 'Me'}
                  partnerName={partner?.nickname ?? 'Ta'}
                  onUpdate={handleUpdate}
                />
                <button onClick={() => handleDelete(c.id)} style={{
                  position: 'absolute', top: 12, right: 12,
                  width: 22, height: 22, borderRadius: 6,
                  border: '1px solid rgba(196,120,90,0.15)',
                  background: 'rgba(255,255,255,0.6)',
                  color: 'rgba(61,35,24,0.3)', cursor: 'pointer',
                  fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>×</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
