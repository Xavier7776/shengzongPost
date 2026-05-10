'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useOnlyUsAuthStore } from '@/stores/onlyus/authStore'
import { getSupabaseClient } from '@/lib/supabase-client'
import type { RealtimeChannel } from '@supabase/supabase-js'

interface DrawPoint {
  x: number; y: number; pressure?: number
}
interface DrawStroke {
  id: string
  user_id: string
  color: string
  width: number
  points: DrawPoint[]
}
interface DrawEvent {
  type: 'stroke' | 'clear' | 'guess'
  stroke?: DrawStroke
  user_id?: string
  guess?: string
}

const PALETTE = ['#3D2318','#C4785A','#E8849C','#F5A623','#7EB8D4','#7BB87E','#9B7EB8','#D4584A','#F8F6F3']
const WIDTHS = [2, 4, 8, 14]

export default function DrawingPage() {
  const { profile, partner, coupleInfo } = useOnlyUsAuthStore()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const channelRef = useRef<RealtimeChannel | null>(null)
  const isDrawingRef = useRef(false)
  const currentStrokeRef = useRef<DrawStroke | null>(null)
  const strokesRef = useRef<DrawStroke[]>([])

  const [color, setColor] = useState('#3D2318')
  const [width, setWidth] = useState(4)
  const [isEraser, setIsEraser] = useState(false)
  const [guess, setGuess] = useState('')
  const [guessLog, setGuessLog] = useState<{ name: string; text: string; ts: number }[]>([])
  const [partnerOnline, setPartnerOnline] = useState(false)
  const [tool, setTool] = useState<'pen' | 'eraser'>('pen')

  const coupleId = coupleInfo?.id ?? ''
  const myId = profile?.id ?? ''
  const myName = profile?.nickname ?? 'Me'
  const partnerName = partner?.nickname ?? 'Ta'

  // ── 重绘所有笔画 ──────────────────────────────────────────────────
  const redraw = useCallback((strokes: DrawStroke[]) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    for (const stroke of strokes) {
      if (stroke.points.length < 2) continue
      ctx.beginPath()
      ctx.strokeStyle = stroke.color
      ctx.lineWidth = stroke.width
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.globalCompositeOperation = stroke.color === '#F8F6F3' ? 'destination-out' : 'source-over'
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y)
      for (let i = 1; i < stroke.points.length; i++) {
        const mid = { x: (stroke.points[i - 1].x + stroke.points[i].x) / 2, y: (stroke.points[i - 1].y + stroke.points[i].y) / 2 }
        ctx.quadraticCurveTo(stroke.points[i - 1].x, stroke.points[i - 1].y, mid.x, mid.y)
      }
      ctx.stroke()
    }
    ctx.globalCompositeOperation = 'source-over'
  }, [])

  // ── Realtime 频道 ─────────────────────────────────────────────────
  useEffect(() => {
    if (!coupleId || !myId) return
    const s = getSupabaseClient()
    const ch = s.channel(`drawing-${coupleId}`, { config: { presence: { key: myId } } })

    ch.on('broadcast', { event: 'draw' }, ({ payload }: { payload: DrawEvent }) => {
      if (payload.type === 'stroke' && payload.stroke) {
        strokesRef.current = [...strokesRef.current, payload.stroke]
        redraw(strokesRef.current)
      } else if (payload.type === 'clear') {
        strokesRef.current = []
        redraw([])
      } else if (payload.type === 'guess' && payload.guess && payload.user_id) {
        const name = payload.user_id === myId ? myName : partnerName
        setGuessLog(g => [...g.slice(-19), { name, text: payload.guess!, ts: Date.now() }])
      }
    })

    ch.on('presence', { event: 'sync' }, () => {
      const state = ch.presenceState()
      setPartnerOnline(Object.keys(state).some(k => k !== myId))
    })

    ch.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await ch.track({ online_at: new Date().toISOString() })
      }
    })

    channelRef.current = ch
    return () => { s.removeChannel(ch) }
  }, [coupleId, myId, myName, partnerName, redraw])

  const broadcast = useCallback((event: DrawEvent) => {
    channelRef.current?.send({ type: 'broadcast', event: 'draw', payload: event })
  }, [])

  // ── Canvas 事件 ────────────────────────────────────────────────────
  const getPos = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement): DrawPoint => {
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    if ('touches' in e) {
      const t = e.touches[0]
      return { x: (t.clientX - rect.left) * scaleX, y: (t.clientY - rect.top) * scaleY }
    }
    return { x: ((e as React.MouseEvent).clientX - rect.left) * scaleX, y: ((e as React.MouseEvent).clientY - rect.top) * scaleY }
  }

  const startDraw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return
    e.preventDefault()
    isDrawingRef.current = true
    const pos = getPos(e, canvas)
    const strokeColor = tool === 'eraser' ? '#F8F6F3' : color
    const strokeWidth = tool === 'eraser' ? 24 : width
    currentStrokeRef.current = {
      id: `${myId}-${Date.now()}`,
      user_id: myId,
      color: strokeColor,
      width: strokeWidth,
      points: [pos],
    }
  }, [color, width, tool, myId])

  const moveDraw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawingRef.current || !currentStrokeRef.current) return
    const canvas = canvasRef.current
    if (!canvas) return
    e.preventDefault()
    const pos = getPos(e, canvas)
    currentStrokeRef.current.points.push(pos)

    // 实时预览（本地立即渲染）
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const pts = currentStrokeRef.current.points
    if (pts.length < 2) return
    ctx.beginPath()
    ctx.strokeStyle = currentStrokeRef.current.color
    ctx.lineWidth = currentStrokeRef.current.width
    ctx.lineCap = 'round'; ctx.lineJoin = 'round'
    ctx.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over'
    const prev = pts[pts.length - 2]
    const mid = { x: (prev.x + pos.x) / 2, y: (prev.y + pos.y) / 2 }
    ctx.moveTo(prev.x, prev.y)
    ctx.quadraticCurveTo(prev.x, prev.y, mid.x, mid.y)
    ctx.stroke()
    ctx.globalCompositeOperation = 'source-over'
  }, [tool])

  const endDraw = useCallback(() => {
    if (!isDrawingRef.current || !currentStrokeRef.current) return
    isDrawingRef.current = false
    const stroke = currentStrokeRef.current
    currentStrokeRef.current = null
    if (stroke.points.length < 2) return
    strokesRef.current = [...strokesRef.current, stroke]
    broadcast({ type: 'stroke', stroke })
  }, [broadcast])

  const handleClear = () => {
    strokesRef.current = []
    redraw([])
    broadcast({ type: 'clear' })
  }

  const handleGuess = () => {
    if (!guess.trim()) return
    const text = guess.trim()
    setGuess('')
    setGuessLog(g => [...g.slice(-19), { name: myName, text, ts: Date.now() }])
    broadcast({ type: 'guess', user_id: myId, guess: text })
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;1,400&family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&display=swap');
        @keyframes card-rise { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
        @keyframes msg-in { from { opacity:0; transform:translateX(-8px); } to { opacity:1; transform:translateX(0); } }
        input:focus { border-color: rgba(196,120,90,0.4) !important; outline: none; }
        canvas { touch-action: none; }
      `}</style>

      <div style={{ minHeight: '100%', padding: '32px 36px 48px', maxWidth: 980, margin: '0 auto' }}>

        {/* 标题 */}
        <div style={{ animation: 'card-rise 0.45s ease both', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 12, letterSpacing: '0.28em', textTransform: 'uppercase', color: 'rgba(196,120,90,0.6)', margin: '0 0 6px' }}>协作画板</p>
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, fontWeight: 400, color: '#3D2318', margin: 0 }}>画画猜猜</h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: partnerOnline ? '#7BB87E' : 'rgba(61,35,24,0.2)' }} />
            <span style={{ fontSize: 11, color: 'rgba(61,35,24,0.4)', fontFamily: "'DM Sans', sans-serif" }}>
              {partnerName} {partnerOnline ? '在线' : '离线'}
            </span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 260px', gap: 14, alignItems: 'start' }}>

          {/* 画板区 */}
          <div style={{ animation: 'card-rise 0.5s ease 0.04s both' }}>
            {/* 工具栏 */}
            <div style={{
              background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(12px)',
              borderRadius: 14, border: '1px solid rgba(196,120,90,0.1)',
              padding: '10px 16px', marginBottom: 10,
              display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
            }}>
              {/* 颜色 */}
              <div style={{ display: 'flex', gap: 5 }}>
                {PALETTE.map(c => (
                  <button key={c} onClick={() => { setColor(c); setTool('pen') }} style={{
                    width: c === color && tool === 'pen' ? 26 : 22,
                    height: c === color && tool === 'pen' ? 26 : 22,
                    borderRadius: '50%', border: c === color && tool === 'pen' ? '2px solid rgba(196,120,90,0.6)' : '2px solid transparent',
                    background: c === '#F8F6F3' ? 'linear-gradient(135deg, #f0f0f0, #fff)' : c,
                    cursor: 'pointer', transition: 'all 0.12s ease',
                    boxShadow: c === '#F8F6F3' ? 'inset 0 0 0 1px rgba(0,0,0,0.1)' : 'none',
                  }} />
                ))}
              </div>

              {/* 分隔 */}
              <div style={{ width: 1, height: 22, background: 'rgba(196,120,90,0.15)' }} />

              {/* 粗细 */}
              <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                {WIDTHS.map(w => (
                  <button key={w} onClick={() => { setWidth(w); setTool('pen') }} style={{
                    width: 28, height: 28, borderRadius: 6, border: w === width && tool === 'pen' ? '1.5px solid rgba(196,120,90,0.5)' : '1.5px solid transparent',
                    background: w === width && tool === 'pen' ? 'rgba(196,120,90,0.08)' : 'transparent',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <div style={{ width: w, height: w, borderRadius: '50%', background: '#3D2318', opacity: 0.6 }} />
                  </button>
                ))}
              </div>

              {/* 分隔 */}
              <div style={{ width: 1, height: 22, background: 'rgba(196,120,90,0.15)' }} />

              {/* 橡皮 */}
              <button onClick={() => setTool(tool === 'eraser' ? 'pen' : 'eraser')} style={{
                padding: '4px 10px', borderRadius: 7, border: 'none',
                background: tool === 'eraser' ? 'rgba(196,120,90,0.12)' : 'transparent',
                color: tool === 'eraser' ? '#C4785A' : 'rgba(61,35,24,0.45)',
                fontSize: 14, cursor: 'pointer',
                border: tool === 'eraser' ? '1px solid rgba(196,120,90,0.25)' : '1px solid transparent',
              } as React.CSSProperties}>🧹</button>

              {/* 清空 */}
              <button onClick={handleClear} style={{
                marginLeft: 'auto', padding: '5px 12px', borderRadius: 7, border: '1px solid rgba(196,120,90,0.2)',
                background: 'transparent', color: 'rgba(61,35,24,0.45)',
                fontSize: 11, fontFamily: "'DM Sans', sans-serif", cursor: 'pointer',
              }}>清空画板</button>
            </div>

            {/* Canvas */}
            <div style={{
              borderRadius: 16, overflow: 'hidden',
              boxShadow: '0 4px 24px rgba(196,120,90,0.1)',
              border: '1px solid rgba(196,120,90,0.12)',
              background: '#fff',
              cursor: tool === 'eraser' ? 'cell' : 'crosshair',
            }}>
              <canvas
                ref={canvasRef}
                width={720} height={480}
                style={{ display: 'block', width: '100%', height: 'auto' }}
                onMouseDown={startDraw}
                onMouseMove={moveDraw}
                onMouseUp={endDraw}
                onMouseLeave={endDraw}
                onTouchStart={startDraw}
                onTouchMove={moveDraw}
                onTouchEnd={endDraw}
              />
            </div>
          </div>

          {/* 右侧猜测区 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, animation: 'card-rise 0.5s ease 0.08s both' }}>
            <div style={{
              background: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(16px)',
              borderRadius: 20, border: '1px solid rgba(196,120,90,0.1)',
              padding: '20px 18px', flex: 1,
            }}>
              <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 11, letterSpacing: '0.3em', textTransform: 'uppercase', color: 'rgba(196,120,90,0.7)', margin: '0 0 14px' }}>
                猜一猜
              </p>

              {/* 消息记录 */}
              <div style={{ minHeight: 200, maxHeight: 340, overflowY: 'auto', marginBottom: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {guessLog.length === 0 ? (
                  <p style={{ fontSize: 12, color: 'rgba(61,35,24,0.3)', fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', textAlign: 'center', paddingTop: 40 }}>
                    画一样东西，让 Ta 猜猜
                  </p>
                ) : guessLog.map((msg, i) => (
                  <div key={i} style={{
                    animation: 'msg-in 0.2s ease',
                    padding: '7px 10px', borderRadius: 10,
                    background: msg.name === myName ? 'rgba(196,120,90,0.07)' : 'rgba(232,132,156,0.07)',
                    border: `1px solid ${msg.name === myName ? 'rgba(196,120,90,0.12)' : 'rgba(232,132,156,0.12)'}`,
                  }}>
                    <p style={{ margin: '0 0 2px', fontSize: 9, letterSpacing: '0.15em', textTransform: 'uppercase', color: msg.name === myName ? 'rgba(196,120,90,0.55)' : 'rgba(232,132,156,0.6)', fontFamily: "'DM Sans', sans-serif" }}>{msg.name}</p>
                    <p style={{ margin: 0, fontSize: 13, color: '#3D2318', fontFamily: "'DM Sans', sans-serif" }}>{msg.text}</p>
                  </div>
                ))}
              </div>

              {/* 输入 */}
              <div style={{ display: 'flex', gap: 6 }}>
                <input
                  value={guess}
                  onChange={e => setGuess(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleGuess()}
                  placeholder="说出你的猜测…"
                  style={{
                    flex: 1, padding: '8px 12px', borderRadius: 9,
                    border: '1px solid rgba(196,120,90,0.18)',
                    background: 'rgba(255,255,255,0.7)',
                    fontSize: 12, color: '#3D2318',
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                />
                <button onClick={handleGuess} disabled={!guess.trim()} style={{
                  width: 34, height: 34, borderRadius: 9, border: 'none',
                  background: guess.trim() ? 'linear-gradient(135deg, #C4785A, #E8849C)' : 'rgba(196,120,90,0.15)',
                  color: '#fff', cursor: guess.trim() ? 'pointer' : 'not-allowed', fontSize: 16,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>→</button>
              </div>
            </div>

            {/* 提示卡 */}
            <div style={{
              background: 'rgba(255,255,255,0.45)', backdropFilter: 'blur(12px)',
              borderRadius: 14, border: '1px solid rgba(196,120,90,0.08)',
              padding: '14px 16px',
            }}>
              <p style={{ margin: 0, fontSize: 11, color: 'rgba(61,35,24,0.4)', fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', lineHeight: 1.6 }}>
                实时协作 — 双方都能在同一张画布上绘画，实时看到对方的笔触
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
