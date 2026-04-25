'use client'

import { useEffect, useRef } from 'react'

export default function ReadingProgressBar() {
  const barRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleScroll() {
      if (!barRef.current) return
      const scrollTop = window.scrollY
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      const pct = docHeight <= 0 ? 100 : Math.min(100, (scrollTop / docHeight) * 100)
      barRef.current.style.width = `${pct}%`
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      height: '3px',
      zIndex: 9999,
      pointerEvents: 'none',
      backgroundColor: 'transparent',
    }}>
      <div
        ref={barRef}
        style={{
          height: '100%',
          width: '0%',
          background: 'linear-gradient(to right, #3b82f6, #6366f1, #8b5cf6)',
          transition: 'width 80ms ease-out',
          boxShadow: '0 0 8px rgba(99,102,241,0.6)',
        }}
      />
    </div>
  )
}