'use client'

import { useState, useRef } from 'react'
import { useIsMobile } from '@/lib/hooks'

const PRESET_OPTIONS = ['火锅', '寿司', '披萨', '饺子', '麻辣烫', '汉堡', '沙拉', '拉面']
const COLORS = ['#C4785A', '#E8849C', '#F5A623', '#7EB8D4', '#7BB87E', '#9B7EB8', '#D4584A', '#6B9BD2']

export default function RoulettePage() {
  const isMobile = useIsMobile()
  const [options, setOptions] = useState<string[]>(PRESET_OPTIONS)
  const [newOption, setNewOption] = useState('')
  const [spinning, setSpinning] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [rotation, setRotation] = useState(0)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [finalAngle, setFinalAngle] = useState(0)

  const addOption = () => {
    if (!newOption.trim() || options.length >= 12) return
    setOptions([...options, newOption.trim()])
    setNewOption('')
  }

  const removeOption = (i: number) => {
    setOptions(options.filter((_, idx) => idx !== i))
    setResult(null)
  }

  const spin = () => {
    if (spinning || options.length < 2) return
    setSpinning(true)
    setResult(null)

    const spins = 5 + Math.random() * 5
    const extraDeg = Math.random() * 360
    const totalDeg = spins * 360 + extraDeg
    const newAngle = finalAngle + totalDeg
    setFinalAngle(newAngle)
    setRotation(newAngle)

    setTimeout(() => {
      // 计算停在哪个扇区
      const segDeg = 360 / options.length
      const normalised = ((newAngle % 360) + 360) % 360
      // 指针在顶部（270°），计算哪个扇区在顶部
      const pointerAt = (360 - normalised + 270) % 360
      const idx = Math.floor(pointerAt / segDeg) % options.length
      setResult(options[idx])
      setSpinning(false)
    }, 4000)
  }

  const n = options.length
  const segDeg = n > 0 ? 360 / n : 360
  const R = 140
  const cx = 160, cy = 160

  const describeArc = (startDeg: number, endDeg: number) => {
    const toRad = (d: number) => (d - 90) * Math.PI / 180
    const x1 = cx + R * Math.cos(toRad(startDeg))
    const y1 = cy + R * Math.sin(toRad(startDeg))
    const x2 = cx + R * Math.cos(toRad(endDeg))
    const y2 = cy + R * Math.sin(toRad(endDeg))
    const large = endDeg - startDeg > 180 ? 1 : 0
    return `M ${cx} ${cy} L ${x1} ${y1} A ${R} ${R} 0 ${large} 1 ${x2} ${y2} Z`
  }

  const textPos = (midDeg: number, r: number) => {
    const rad = (midDeg - 90) * Math.PI / 180
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;1,400&family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&display=swap');
        @keyframes result-pop { from { opacity:0; transform:scale(0.7) translateY(8px); } to { opacity:1; transform:scale(1) translateY(0); } }
        input:focus { border-color: rgba(196,120,90,0.4) !important; outline: none; }
      `}</style>

      <div style={{ minHeight: '100%', padding: isMobile ? '20px 16px 80px' : '36px 40px 60px', maxWidth: 800, margin: '0 auto' }}>
        <div style={{ marginBottom: 28 }}>
          <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 12, letterSpacing: '0.28em', textTransform: 'uppercase', color: 'rgba(196,120,90,0.6)', margin: '0 0 6px' }}>今天</p>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 400, color: '#3D2318', margin: 0 }}>转盘决策</h1>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 280px', gap: 20, alignItems: 'start' }}>

          {/* 转盘 */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ position: 'relative', marginBottom: 20 }}>
              {/* 指针 */}
              <div style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', zIndex: 10 }}>
                <svg width="24" height="24" viewBox="0 0 24 24">
                  <polygon points="12,2 18,14 6,14" fill="#C4785A" filter="drop-shadow(0 2px 4px rgba(196,120,90,0.4))" />
                </svg>
              </div>

              {/* 转盘 SVG */}
              <svg
                width="320" height="320"
                viewBox="0 0 320 320"
                style={{
                  transform: `rotate(${rotation}deg)`,
                  transition: spinning ? 'transform 4s cubic-bezier(0.2, 0, 0.1, 1)' : 'none',
                  borderRadius: '50%',
                  boxShadow: '0 8px 32px rgba(196,120,90,0.25), 0 2px 8px rgba(0,0,0,0.08)',
                  maxWidth: '100%',
                  height: 'auto',
                }}
              >
                {n === 0 ? (
                  <circle cx={cx} cy={cy} r={R} fill="rgba(196,120,90,0.08)" />
                ) : options.map((opt, i) => {
                  const start = i * segDeg
                  const end = start + segDeg
                  const mid = start + segDeg / 2
                  const tp = textPos(mid, R * 0.62)
                  const color = COLORS[i % COLORS.length]
                  return (
                    <g key={i}>
                      <path d={describeArc(start, end)} fill={color} stroke="#F8F6F3" strokeWidth="1.5" />
                      <text
                        x={tp.x} y={tp.y}
                        textAnchor="middle" dominantBaseline="middle"
                        fill="rgba(255,255,255,0.92)"
                        fontSize={opt.length > 4 ? '10' : '12'}
                        fontFamily="'DM Sans', sans-serif"
                        fontWeight="600"
                        transform={`rotate(${mid}, ${tp.x}, ${tp.y})`}
                      >
                        {opt.length > 5 ? opt.slice(0, 5) + '…' : opt}
                      </text>
                    </g>
                  )
                })}
                {/* 中心圆 */}
                <circle cx={cx} cy={cy} r={18} fill="#F8F6F3" stroke="rgba(196,120,90,0.2)" strokeWidth="2" />
                <circle cx={cx} cy={cy} r={10} fill="linear-gradient(135deg, #C4785A, #E8849C)" />
              </svg>
            </div>

            {/* 转动按钮 */}
            <button
              onClick={spin}
              disabled={spinning || options.length < 2}
              style={{
                padding: '13px 40px', borderRadius: 14, border: 'none',
                background: spinning || options.length < 2
                  ? 'rgba(196,120,90,0.2)'
                  : 'linear-gradient(135deg, #C4785A, #E8849C)',
                color: '#fff', fontSize: 15,
                fontFamily: "'Playfair Display', serif",
                fontStyle: 'italic',
                cursor: spinning || options.length < 2 ? 'not-allowed' : 'pointer',
                boxShadow: spinning ? 'none' : '0 4px 20px rgba(196,120,90,0.3)',
                transition: 'all 0.2s ease',
              }}
            >
              {spinning ? '旋转中…' : '转！'}
            </button>

            {/* 结果 */}
            {result && !spinning && (
              <div style={{
                marginTop: 20, textAlign: 'center',
                animation: 'result-pop 0.4s cubic-bezier(0.16,1,0.3,1)',
              }}>
                <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 12, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(196,120,90,0.6)', margin: '0 0 6px' }}>
                  命运之选
                </p>
                <p style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: 28, fontWeight: 400, color: '#C4785A',
                  margin: 0,
                }}>
                  {result} ✨
                </p>
              </div>
            )}
          </div>

          {/* 右侧选项管理 */}
          <div style={{ background: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(16px)', borderRadius: 20, border: '1px solid rgba(196,120,90,0.1)', padding: '22px 20px' }}>
            <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 11, letterSpacing: '0.3em', textTransform: 'uppercase', color: 'rgba(196,120,90,0.7)', margin: '0 0 14px' }}>
              选项 · {n}/12
            </p>

            <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
              <input
                value={newOption}
                onChange={e => setNewOption(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addOption()}
                placeholder="添加选项…"
                disabled={n >= 12}
                style={{
                  flex: 1, padding: '8px 12px', borderRadius: 8,
                  border: '1px solid rgba(196,120,90,0.18)',
                  background: 'rgba(255,255,255,0.7)',
                  fontSize: 12, color: '#3D2318',
                  fontFamily: "'DM Sans', sans-serif",
                }}
              />
              <button onClick={addOption} disabled={!newOption.trim() || n >= 12} style={{
                width: 32, height: 32, borderRadius: 8, border: 'none',
                background: newOption.trim() && n < 12 ? '#C4785A' : 'rgba(196,120,90,0.15)',
                color: '#fff', cursor: newOption.trim() && n < 12 ? 'pointer' : 'not-allowed',
                fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>+</button>
            </div>

            <div style={{ maxHeight: 300, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {options.map((opt, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '7px 10px', borderRadius: 8,
                  background: `${COLORS[i % COLORS.length]}14`,
                  border: `1px solid ${COLORS[i % COLORS.length]}22`,
                }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: COLORS[i % COLORS.length], flexShrink: 0 }} />
                  <span style={{ flex: 1, fontSize: 12, color: '#3D2318', fontFamily: "'DM Sans', sans-serif" }}>{opt}</span>
                  <button onClick={() => removeOption(i)} style={{ width: 18, height: 18, border: 'none', background: 'transparent', color: 'rgba(61,35,24,0.3)', cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
