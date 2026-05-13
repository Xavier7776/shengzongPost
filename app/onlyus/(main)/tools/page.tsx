'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useIsMobile } from '@/lib/hooks'

const TOOLS = [
  {
    href: '/onlyus/tools/roulette',
    emoji: '🎡',
    title: '转盘决策',
    desc: '今天吃什么？让转盘说了算',
    color: '#F5A623',
    bg: 'rgba(245,166,35,0.08)',
    border: 'rgba(245,166,35,0.18)',
  },
  {
    href: '/onlyus/tools/counter',
    emoji: '🔢',
    title: '计数器',
    desc: '一起记录那些重要的数字',
    color: '#C4785A',
    bg: 'rgba(196,120,90,0.08)',
    border: 'rgba(196,120,90,0.18)',
  },
  {
    href: '/onlyus/tools/gomoku',
    emoji: '⚫',
    title: '五子棋',
    desc: '实时联机对弈，输了就罚',
    color: '#3D2318',
    bg: 'rgba(61,35,24,0.06)',
    border: 'rgba(61,35,24,0.14)',
  },
  {
    href: '/onlyus/tools/expense',
    emoji: '💰',
    title: '共同账单',
    desc: 'AA 还是 ta 请客？一目了然',
    color: '#7EB8D4',
    bg: 'rgba(126,184,212,0.08)',
    border: 'rgba(126,184,212,0.18)',
  },
  {
    href: '/onlyus/tools/drawing',
    emoji: '🎨',
    title: '画画猜猜',
    desc: '实时协作画板，猜对了奖励你',
    color: '#E8849C',
    bg: 'rgba(232,132,156,0.08)',
    border: 'rgba(232,132,156,0.18)',
  },
  {
    href: '/onlyus/tools/calendar',
    emoji: '📅',
    title: '共享日历',
    desc: '记录两人的重要日子',
    color: '#7BB87E',
    bg: 'rgba(123,184,126,0.08)',
    border: 'rgba(123,184,126,0.18)',
  },
  {
    href: '/onlyus/tools/quiz',
    emoji: '❓',
    title: '双人问答',
    desc: '测试默契，看谁更了解对方',
    color: '#9B8EC4',
    bg: 'rgba(155,142,196,0.08)',
    border: 'rgba(155,142,196,0.18)',
  },
  {
    href: '/onlyus/tools/pet',
    emoji: '🐾',
    title: '虚拟宠物',
    desc: '一起养一只小宠物吧',
    color: '#D4A05E',
    bg: 'rgba(212,160,94,0.08)',
    border: 'rgba(212,160,94,0.18)',
  },
]

function ToolCard({ tool, index, mobile = false }: { tool: typeof TOOLS[0]; index: number; mobile?: boolean }) {
  const [hovered, setHovered] = useState(false)

  return (
    <Link
      href={tool.href}
      style={{ textDecoration: 'none' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{
        background: hovered ? `rgba(255,255,255,0.72)` : 'rgba(255,255,255,0.50)',
        backdropFilter: 'blur(16px)',
        borderRadius: 20,
        border: `1px solid ${hovered ? tool.border : 'rgba(196,120,90,0.1)'}`,
        padding: mobile ? '20px 16px 18px' : '28px 28px 24px',
        cursor: 'pointer',
        transition: 'all 0.25s cubic-bezier(0.16,1,0.3,1)',
        transform: hovered ? 'translateY(-6px) scale(1.02)' : 'translateY(0) scale(1)',
        boxShadow: hovered
          ? `0 12px 40px ${tool.border}, 0 4px 12px rgba(0,0,0,0.05)`
          : '0 2px 8px rgba(196,120,90,0.06)',
        animation: `card-rise 0.5s cubic-bezier(0.16,1,0.3,1) ${index * 60}ms both`,
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* 背景色块 */}
        <div style={{
          position: 'absolute', top: -20, right: -20,
          width: 100, height: 100, borderRadius: '50%',
          background: `radial-gradient(ellipse, ${tool.bg.replace('0.08', '0.2')}, transparent 70%)`,
          transition: 'transform 0.3s ease',
          transform: hovered ? 'scale(1.4)' : 'scale(1)',
          pointerEvents: 'none',
        }} />

        {/* Emoji */}
        <div style={{
          fontSize: 36, marginBottom: 14,
          display: 'inline-block',
          transform: hovered ? 'scale(1.15) translateY(-2px)' : 'scale(1)',
          transition: 'transform 0.25s cubic-bezier(0.16,1,0.3,1)',
          filter: hovered ? 'drop-shadow(0 4px 8px rgba(0,0,0,0.12))' : 'none',
        }}>
          {tool.emoji}
        </div>

        <h3 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: 17, fontWeight: 400,
          color: hovered ? tool.color : '#3D2318',
          margin: '0 0 8px',
          transition: 'color 0.2s ease',
        }}>
          {tool.title}
        </h3>
        <p style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 12, color: 'rgba(61,35,24,0.45)',
          margin: 0, lineHeight: 1.5,
        }}>
          {tool.desc}
        </p>

        {/* 箭头 */}
        <div style={{
          position: 'absolute', bottom: 22, right: 22,
          opacity: hovered ? 1 : 0,
          transform: hovered ? 'translateX(0)' : 'translateX(-6px)',
          transition: 'all 0.22s ease',
          color: tool.color,
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </Link>
  )
}

export default function ToolsPage() {
  const isMobile = useIsMobile()
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;1,400&family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&display=swap');
        @keyframes card-rise { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
      `}</style>

      <div style={{ minHeight: '100%', padding: isMobile ? '20px 16px 80px' : '40px 40px 60px', maxWidth: 860, margin: '0 auto' }}>
        <div style={{ animation: 'card-rise 0.45s ease both', marginBottom: 36 }}>
          <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 12, letterSpacing: '0.28em', textTransform: 'uppercase', color: 'rgba(196,120,90,0.6)', margin: '0 0 6px' }}>
            专属工具箱
          </p>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 400, color: '#3D2318', margin: 0 }}>
            一起玩
          </h1>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)', gap: 14 }}>
          {TOOLS.map((tool, i) => (
            <ToolCard key={tool.href} tool={tool} index={i} mobile={isMobile} />
          ))}
        </div>
      </div>
    </>
  )
}
