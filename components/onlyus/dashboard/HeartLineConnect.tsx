'use client'

import { useEffect, useRef, useState } from 'react'

interface HeartLineConnectProps {
  myName: string
  partnerName: string
  myAvatarUrl?: string | null
  partnerAvatarUrl?: string | null
}

// 生成心电图风格路径数据（SVG path d 属性）
function generateECGPath(width: number, height: number): string {
  const mid = height / 2
  const segments: string[] = [`M 0 ${mid}`]

  // 平静段 → P波 → QRS波群 → T波 → 平静
  const w = width
  // 左平静
  segments.push(`L ${w * 0.15} ${mid}`)
  // P波（小圆丘）
  segments.push(`Q ${w * 0.18} ${mid - height * 0.12} ${w * 0.21} ${mid}`)
  // PR段
  segments.push(`L ${w * 0.28} ${mid}`)
  // Q波（小向下）
  segments.push(`L ${w * 0.31} ${mid + height * 0.08}`)
  // R波（主峰）
  segments.push(`L ${w * 0.34} ${mid - height * 0.42}`)
  // S波（向下）
  segments.push(`L ${w * 0.37} ${mid + height * 0.15}`)
  // 回中
  segments.push(`L ${w * 0.42} ${mid}`)
  // ST段
  segments.push(`L ${w * 0.5} ${mid}`)
  // T波（圆润鼓包）
  segments.push(`Q ${w * 0.55} ${mid - height * 0.18} ${w * 0.6} ${mid}`)
  // 右平静
  segments.push(`L ${w} ${mid}`)

  return segments.join(' ')
}

export default function HeartLineConnect({
  myName, partnerName, myAvatarUrl, partnerAvatarUrl,
}: HeartLineConnectProps) {
  const svgRef = useRef<SVGPathElement>(null)
  const [pathLength, setPathLength] = useState(0)
  const [animated, setAnimated] = useState(false)

  useEffect(() => {
    if (svgRef.current) {
      setPathLength(svgRef.current.getTotalLength())
    }
    // 入场延迟
    const t = setTimeout(() => setAnimated(true), 600)
    return () => clearTimeout(t)
  }, [])

  const W = 260
  const H = 60
  const path = generateECGPath(W, H)

  const AvatarCircle = ({ url, name, right }: { url?: string | null; name: string; right?: boolean }) => (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: '50%',
        border: `2px solid ${right ? 'rgba(232,132,156,0.4)' : 'rgba(196,120,90,0.4)'}`,
        background: right ? 'rgba(232,132,156,0.1)' : 'rgba(196,120,90,0.1)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden', fontSize: 16, color: right ? '#E8849C' : '#C4785A',
        fontFamily: "'DM Sans', sans-serif", fontWeight: 600,
      }}>
        {url
          ? <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : name[0]?.toUpperCase()}
      </div>
      <span style={{
        fontSize: 10, letterSpacing: '0.06em',
        color: 'rgba(61,35,24,0.45)',
        fontFamily: "'DM Sans', sans-serif",
      }}>
        {name}
      </span>
    </div>
  )

  return (
    <div style={{
      background: 'rgba(255,255,255,0.45)',
      backdropFilter: 'blur(16px)',
      borderRadius: 20,
      border: '1px solid rgba(196,120,90,0.1)',
      padding: '24px 28px',
    }}>
      <p style={{
        fontFamily: "'Cormorant Garamond', serif",
        fontSize: 11, letterSpacing: '0.3em',
        textTransform: 'uppercase',
        color: 'rgba(196,120,90,0.7)',
        margin: '0 0 18px',
      }}>
        心跳连接
      </p>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <AvatarCircle url={myAvatarUrl} name={myName} />

        {/* 心电图 SVG */}
        <div style={{ flex: 1, position: 'relative' }}>
          <svg width="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ overflow: 'visible' }}>
            <defs>
              <linearGradient id="ecg-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#C4785A" />
                <stop offset="50%" stopColor="#E8849C" />
                <stop offset="100%" stopColor="#C4785A" />
              </linearGradient>
              <filter id="ecg-glow">
                <feGaussianBlur stdDeviation="1.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* 背景网格线 */}
            <line x1="0" y1={H / 2} x2={W} y2={H / 2}
              stroke="rgba(196,120,90,0.1)" strokeWidth="1" strokeDasharray="3,6" />

            {/* 主路径 */}
            <path
              ref={svgRef}
              d={path}
              fill="none"
              stroke="url(#ecg-gradient)"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#ecg-glow)"
              style={{
                strokeDasharray: pathLength || 1000,
                strokeDashoffset: animated ? 0 : pathLength || 1000,
                transition: animated ? 'stroke-dashoffset 1.8s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
              }}
            />

            {/* 扫描点（循环动画）*/}
            {animated && (
              <circle r="3" fill="#E8849C" filter="url(#ecg-glow)">
                <animateMotion dur="2.8s" repeatCount="indefinite" path={path} />
              </circle>
            )}
          </svg>
        </div>

        <AvatarCircle url={partnerAvatarUrl} name={partnerName} right />
      </div>
    </div>
  )
}
