'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useOnlyUsAuthStore } from '@/stores/onlyus/authStore'
import { useIsMobile } from '@/lib/hooks'
import { useDrawingStore, type Stroke } from '@/stores/onlyus/gameStores'

const PALETTE = ['#3D2318','#C4785A','#E8849C','#F5A623','#7EB8D4','#7BB87E','#9B7EB8','#D4584A','#F8F6F3']
const WIDTHS = [2, 4, 8, 14]
const ROUND_TIME = 90
const MAX_WRONG = 3

export default function DrawingPage() {
  const { profile, partner, coupleInfo } = useOnlyUsAuthStore()
  const isMobile = useIsMobile()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const isDrawingRef = useRef(false)
  const currentPointsRef = useRef<{ x: number; y: number }[]>([])
  const localStrokesRef = useRef<Stroke[]>([])

  const { game, myRole, isLoading, loadOrCreateGame, addStroke, clearCanvas, submitGuess, requestHint, skipRound, nextRound, subscribeToGame, unsubscribe } = useDrawingStore()

  const [color, setColor] = useState('#3D2318')
  const [width, setWidth] = useState(4)
  const [tool, setTool] = useState<'pen' | 'eraser'>('pen')
  const [guess, setGuess] = useState('')
  const [guessFeedback, setGuessFeedback] = useState<string | null>(null)
  const [timeLeft, setTimeLeft] = useState(ROUND_TIME)

  const coupleId = coupleInfo?.id ?? ''
  const myId = profile?.id ?? ''
  const partnerId = partner?.id ?? ''
  const myName = profile?.nickname ?? 'Me'
  const partnerName = partner?.nickname ?? 'Ta'

  // ── 初始化游戏 ──
  useEffect(() => {
    if (!coupleId || !myId || !partnerId) return
    loadOrCreateGame(coupleId, myId, partnerId).then(() => { subscribeToGame() })
    return () => unsubscribe()
  }, [coupleId, myId, partnerId, loadOrCreateGame, subscribeToGame, unsubscribe])

  // ── 倒计时 ──
  useEffect(() => {
    if (!game || game.status !== 'drawing') return
    setTimeLeft(ROUND_TIME)
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { clearInterval(interval); skipRound(); return 0 }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game?.round, game?.status, skipRound])

  // ── 重绘 ──
  const redraw = useCallback((strokes: Stroke[]) => {
    const canvas = canvasRef.current; if (!canvas) return
    const ctx = canvas.getContext('2d'); if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    for (const stroke of strokes) {
      if (stroke.points.length < 2) continue
      ctx.beginPath(); ctx.strokeStyle = stroke.color; ctx.lineWidth = stroke.width
      ctx.lineCap = 'round'; ctx.lineJoin = 'round'
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

  useEffect(() => {
    if (game) { localStrokesRef.current = game.strokes; redraw(game.strokes) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game?.strokes, redraw])

  useEffect(() => {
    if (game?.status === 'drawing') setGuessFeedback(null)
  }, [game?.status, game?.round])

  // ── Canvas 事件 ──
  const getPos = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width; const scaleY = canvas.height / rect.height
    if ('touches' in e) { const t = e.touches[0]; return { x: (t.clientX - rect.left) * scaleX, y: (t.clientY - rect.top) * scaleY } }
    return { x: ((e as React.MouseEvent).clientX - rect.left) * scaleX, y: ((e as React.MouseEvent).clientY - rect.top) * scaleY }
  }
  const startDraw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (myRole !== 'drawer' || game?.status !== 'drawing') return
    const canvas = canvasRef.current; if (!canvas) return; e.preventDefault()
    isDrawingRef.current = true; currentPointsRef.current = [getPos(e, canvas)]
  }, [myRole, game?.status])
  const moveDraw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawingRef.current || myRole !== 'drawer') return
    const canvas = canvasRef.current; if (!canvas) return; e.preventDefault()
    const pos = getPos(e, canvas); currentPointsRef.current.push(pos)
    const ctx = canvas.getContext('2d'); if (!ctx) return
    const pts = currentPointsRef.current; if (pts.length < 2) return
    ctx.beginPath(); ctx.strokeStyle = tool === 'eraser' ? '#F8F6F3' : color; ctx.lineWidth = tool === 'eraser' ? 24 : width
    ctx.lineCap = 'round'; ctx.lineJoin = 'round'
    ctx.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over'
    const prev = pts[pts.length - 2]; const mid = { x: (prev.x + pos.x) / 2, y: (prev.y + pos.y) / 2 }
    ctx.moveTo(prev.x, prev.y); ctx.quadraticCurveTo(prev.x, prev.y, mid.x, mid.y); ctx.stroke()
    ctx.globalCompositeOperation = 'source-over'
  }, [color, width, tool, myRole])
  const endDraw = useCallback(() => {
    if (!isDrawingRef.current || myRole !== 'drawer') return
    isDrawingRef.current = false
    const points = currentPointsRef.current; currentPointsRef.current = []
    if (points.length < 2) return
    const stroke: Stroke = { points, color: tool === 'eraser' ? '#F8F6F3' : color, width: tool === 'eraser' ? 24 : width }
    localStrokesRef.current = [...localStrokesRef.current, stroke]; addStroke(stroke)
  }, [color, width, tool, myRole, addStroke])

  const handleClear = () => { localStrokesRef.current = []; redraw([]); clearCanvas() }

  const handleGuess = () => {
    if (!guess.trim() || !game || game.status !== 'drawing') return
    const isCorrect = guess.trim() === game.word
    submitGuess(guess.trim())
    setGuessFeedback(isCorrect ? null : '再试试!')
    setGuess('')
  }

  // ── 加载状态 ──
  if (isLoading || !game) {
    return <div style={{ minHeight: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(61,35,24,0.4)', fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: 16 }}>连接中…</div>
  }

  const isDrawer = myRole === 'drawer'
  const isGuesser = myRole === 'guesser'
  const drawerName = game.drawer === myId ? myName : partnerName
  const guesserName = game.guesser === myId ? myName : partnerName
  const isRoundOver = game.status === 'correct' || game.status === 'skipped'
  const guessesLeft = MAX_WRONG - (game.wrong_guesses || 0)
  const timePercent = (timeLeft / ROUND_TIME) * 100
  const canHint = isGuesser && game.status === 'drawing' && game.hint_revealed < game.word.length - 1

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;1,400&family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&display=swap');
        @keyframes card-rise { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
        @keyframes pop-in { from { opacity:0; transform:scale(0.9); } to { opacity:1; transform:scale(1); } }
        @keyframes shake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-4px)} 75%{transform:translateX(4px)} }
        input:focus { border-color: rgba(196,120,90,0.4) !important; outline: none; }
        canvas { touch-action: none; }
      `}</style>

      <div style={{ minHeight: '100%', padding: isMobile ? '20px 16px 80px' : '32px 36px 48px', maxWidth: 980, margin: '0 auto' }}>

        {/* 标题 + 比分 */}
        <div style={{ animation: 'card-rise 0.45s ease both', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: isMobile ? 'center' : 'flex-end', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? 8 : 0 }}>
          <div>
            <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 12, letterSpacing: '0.28em', textTransform: 'uppercase', color: 'rgba(196,120,90,0.6)', margin: '0 0 6px' }}>画画猜猜 · 第 {game.round} 轮</p>
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, fontWeight: 400, color: '#3D2318', margin: 0 }}>画画猜猜</h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 11, color: 'rgba(61,35,24,0.5)' }}>画师</span>
              <span style={{ fontSize: 12, color: '#C4785A', fontWeight: 500 }}>{drawerName}</span>
              <span style={{ fontSize: 10, color: 'rgba(61,35,24,0.3)' }}>{game.drawer_score}分</span>
            </div>
            <span style={{ color: 'rgba(196,120,90,0.3)', fontSize: 11 }}>vs</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 11, color: 'rgba(61,35,24,0.5)' }}>猜手</span>
              <span style={{ fontSize: 12, color: '#E8849C', fontWeight: 500 }}>{guesserName}</span>
              <span style={{ fontSize: 10, color: 'rgba(61,35,24,0.3)' }}>{game.guesser_score}分</span>
            </div>
          </div>
        </div>

        {/* 倒计时 + 跳过 */}
        {!isRoundOver && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14, animation: 'card-rise 0.45s ease 0.02s both' }}>
            <span style={{ fontSize: 13, fontFamily: "'DM Sans', sans-serif", fontWeight: 600, color: timeLeft <= 10 ? '#D4584A' : 'rgba(61,35,24,0.5)', minWidth: 38 }}>
              ⏱ {String(Math.floor(timeLeft / 60)).padStart(2, '0')}:{String(timeLeft % 60).padStart(2, '0')}
            </span>
            <div style={{ flex: 1, height: 6, borderRadius: 3, background: 'rgba(196,120,90,0.1)', overflow: 'hidden' }}>
              <div style={{ height: '100%', borderRadius: 3, background: timeLeft <= 10 ? '#D4584A' : 'linear-gradient(90deg, #C4785A, #E8849C)', width: `${timePercent}%`, transition: 'width 1s linear' }} />
            </div>
            <button onClick={skipRound} style={{ padding: '4px 12px', borderRadius: 7, border: '1px solid rgba(196,120,90,0.2)', background: 'transparent', color: 'rgba(61,35,24,0.4)', fontSize: 11, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>跳过</button>
          </div>
        )}

        {/* 回合结果 */}
        {isRoundOver && (
          <div style={{
            animation: 'pop-in 0.35s ease both', marginBottom: 16, padding: '20px 24px', borderRadius: 16,
            background: game.status === 'correct' ? 'linear-gradient(135deg, rgba(123,184,126,0.12), rgba(196,120,90,0.12))' : 'linear-gradient(135deg, rgba(212,88,74,0.08), rgba(196,120,90,0.08))',
            border: game.status === 'correct' ? '1px solid rgba(123,184,126,0.25)' : '1px solid rgba(212,88,74,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
          }}>
            <div>
              <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, color: '#3D2318', margin: '0 0 4px' }}>
                {game.status === 'correct' ? '猜对了!' : (game.wrong_guesses >= MAX_WRONG ? '机会用完!' : '本轮跳过')} 答案是「{game.word}」
              </p>
              <p style={{ fontSize: 12, color: 'rgba(61,35,24,0.5)', margin: 0 }}>
                {game.status === 'correct' ? `${guesserName} 获得 1 分` : '没有人得分'}
              </p>
            </div>
            <button onClick={nextRound} style={{ padding: '10px 24px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #C4785A, #E8849C)', color: '#fff', fontSize: 13, fontFamily: "'DM Sans', sans-serif", cursor: 'pointer' }}>下一轮</button>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 260px', gap: 14, alignItems: 'start' }}>

          {/* 画板区 */}
          <div style={{ animation: 'card-rise 0.5s ease 0.04s both' }}>
            {/* 工具栏 */}
            {isDrawer && !isRoundOver && (
              <div style={{ background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(12px)', borderRadius: 14, border: '1px solid rgba(196,120,90,0.1)', padding: '10px 16px', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', gap: 5 }}>
                  {PALETTE.map(c => (
                    <button key={c} onClick={() => { setColor(c); setTool('pen') }} style={{ width: c === color && tool === 'pen' ? 26 : 22, height: c === color && tool === 'pen' ? 26 : 22, borderRadius: '50%', border: c === color && tool === 'pen' ? '2px solid rgba(196,120,90,0.6)' : '2px solid transparent', background: c === '#F8F6F3' ? 'linear-gradient(135deg, #f0f0f0, #fff)' : c, cursor: 'pointer', transition: 'all 0.12s ease', boxShadow: c === '#F8F6F3' ? 'inset 0 0 0 1px rgba(0,0,0,0.1)' : 'none' }} />
                  ))}
                </div>
                <div style={{ width: 1, height: 22, background: 'rgba(196,120,90,0.15)' }} />
                <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                  {WIDTHS.map(w => (
                    <button key={w} onClick={() => { setWidth(w); setTool('pen') }} style={{ width: 28, height: 28, borderRadius: 6, border: w === width && tool === 'pen' ? '1.5px solid rgba(196,120,90,0.5)' : '1.5px solid transparent', background: w === width && tool === 'pen' ? 'rgba(196,120,90,0.08)' : 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{ width: w, height: w, borderRadius: '50%', background: '#3D2318', opacity: 0.6 }} />
                    </button>
                  ))}
                </div>
                <div style={{ width: 1, height: 22, background: 'rgba(196,120,90,0.15)' }} />
                <button onClick={() => setTool(tool === 'eraser' ? 'pen' : 'eraser')} style={{ padding: '4px 10px', borderRadius: 7, background: tool === 'eraser' ? 'rgba(196,120,90,0.12)' : 'transparent', color: tool === 'eraser' ? '#C4785A' : 'rgba(61,35,24,0.45)', fontSize: 14, cursor: 'pointer', border: tool === 'eraser' ? '1px solid rgba(196,120,90,0.25)' : '1px solid transparent' } as React.CSSProperties}>🧽</button>
                <button onClick={handleClear} style={{ marginLeft: 'auto', padding: '5px 12px', borderRadius: 7, border: '1px solid rgba(196,120,90,0.2)', background: 'transparent', color: 'rgba(61,35,24,0.45)', fontSize: 11, fontFamily: "'DM Sans', sans-serif", cursor: 'pointer' }}>清空画板</button>
              </div>
            )}

            {/* Canvas */}
            <div style={{ borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 24px rgba(196,120,90,0.1)', border: '1px solid rgba(196,120,90,0.12)', background: '#fff', cursor: isDrawer && !isRoundOver ? (tool === 'eraser' ? 'cell' : 'crosshair') : 'default' }}>
              <canvas ref={canvasRef} width={720} height={480} style={{ display: 'block', width: '100%', height: 'auto', pointerEvents: isDrawer && !isRoundOver ? 'auto' : 'none' }} onMouseDown={startDraw} onMouseMove={moveDraw} onMouseUp={endDraw} onMouseLeave={endDraw} onTouchStart={startDraw} onTouchMove={moveDraw} onTouchEnd={endDraw} />
            </div>
          </div>

          {/* 右侧信息区 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, animation: 'card-rise 0.5s ease 0.08s both' }}>

            {/* 画师：显示题目 */}
            {isDrawer && (
              <div style={{ background: 'linear-gradient(135deg, rgba(196,120,90,0.1), rgba(232,132,156,0.1))', backdropFilter: 'blur(16px)', borderRadius: 20, border: '1px solid rgba(196,120,90,0.15)', padding: '24px 20px', textAlign: 'center' }}>
                <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 10, letterSpacing: '0.3em', textTransform: 'uppercase', color: 'rgba(196,120,90,0.6)', margin: '0 0 10px' }}>请画这个词</p>
                <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, color: '#3D2318', margin: 0, fontWeight: 500 }}>{game.word}</p>
                <p style={{ fontSize: 11, color: 'rgba(61,35,24,0.4)', margin: '10px 0 0' }}>{isRoundOver ? '本轮结束' : `${guesserName} 正在猜…`}</p>
              </div>
            )}

            {/* 猜手：猜测区 */}
            {isGuesser && (
              <div style={{ background: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(16px)', borderRadius: 20, border: '1px solid rgba(196,120,90,0.1)', padding: '20px 18px' }}>
                <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 11, letterSpacing: '0.3em', textTransform: 'uppercase', color: 'rgba(196,120,90,0.7)', margin: '0 0 8px' }}>猜一猜</p>

                {/* 提示字 */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 12 }}>
                  {game.word.split('').map((ch, i) => (
                    <span key={i} style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 500, color: i < game.hint_revealed ? '#3D2318' : 'rgba(61,35,24,0.2)', borderBottom: '2px solid rgba(196,120,90,0.2)', minWidth: 24, textAlign: 'center', paddingBottom: 4 }}>
                      {i < game.hint_revealed ? ch : '?'}
                    </span>
                  ))}
                </div>

                {/* 剩余机会 */}
                {!isRoundOver && (
                  <div style={{ display: 'flex', justifyContent: 'center', gap: 4, marginBottom: 12 }}>
                    {Array.from({ length: MAX_WRONG }).map((_, i) => (
                      <span key={i} style={{ fontSize: 14, opacity: i < guessesLeft ? 1 : 0.2 }}>{i < guessesLeft ? '❤️' : '🖤'}</span>
                    ))}
                  </div>
                )}

                {guessFeedback && !isRoundOver && (
                  <p style={{ fontSize: 12, color: '#D4584A', margin: '0 0 10px', fontWeight: 500, animation: 'shake 0.3s ease', textAlign: 'center' }}>{guessFeedback}</p>
                )}

                {game.guess_text && !isRoundOver && (
                  <div style={{ padding: '8px 12px', borderRadius: 10, marginBottom: 10, background: 'rgba(212,88,74,0.06)', border: '1px solid rgba(212,88,74,0.12)' }}>
                    <p style={{ fontSize: 9, color: 'rgba(61,35,24,0.4)', margin: '0 0 2px', letterSpacing: '0.1em' }}>上一次猜测</p>
                    <p style={{ fontSize: 13, color: '#3D2318', margin: 0 }}>{game.guess_text}</p>
                  </div>
                )}

                {!isRoundOver && (
                  <div style={{ display: 'flex', gap: 6 }}>
                    <input value={guess} onChange={e => setGuess(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleGuess()} placeholder="说出你的猜测…" style={{ flex: 1, padding: '8px 12px', borderRadius: 9, border: '1px solid rgba(196,120,90,0.18)', background: 'rgba(255,255,255,0.7)', fontSize: 12, color: '#3D2318', fontFamily: "'DM Sans', sans-serif" }} />
                    <button onClick={handleGuess} disabled={!guess.trim()} style={{ width: 34, height: 34, borderRadius: 9, border: 'none', background: guess.trim() ? 'linear-gradient(135deg, #C4785A, #E8849C)' : 'rgba(196,120,90,0.15)', color: '#fff', cursor: guess.trim() ? 'pointer' : 'not-allowed', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>→</button>
                  </div>
                )}

                {/* 提示按钮 */}
                {canHint && (
                  <button onClick={requestHint} style={{ width: '100%', marginTop: 8, padding: '6px', borderRadius: 8, border: '1px dashed rgba(196,120,90,0.25)', background: 'transparent', color: 'rgba(196,120,90,0.6)', fontSize: 11, fontFamily: "'DM Sans', sans-serif", cursor: 'pointer' }}>
                    💡 提示 (已揭示 {game.hint_revealed}/{game.word.length - 1})
                  </button>
                )}
              </div>
            )}

            {/* 提示卡 */}
            <div style={{ background: 'rgba(255,255,255,0.45)', backdropFilter: 'blur(12px)', borderRadius: 14, border: '1px solid rgba(196,120,90,0.08)', padding: '14px 16px' }}>
              <p style={{ margin: 0, fontSize: 11, color: 'rgba(61,35,24,0.4)', fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', lineHeight: 1.6 }}>
                {isRoundOver
                  ? '点击「下一轮」继续，角色互换'
                  : isDrawer ? '你来画画，让 Ta 猜猜看是什么词' : `${drawerName} 正在画，猜猜是什么词`}
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
