'use client'

import { useState, useEffect } from 'react'

export default function CursorGlow() {
  const [pos, setPos] = useState({ x: -300, y: -300 })

  useEffect(() => {
    const handler = (e: MouseEvent) => setPos({ x: e.clientX, y: e.clientY })
    window.addEventListener('mousemove', handler, { passive: true })
    return () => window.removeEventListener('mousemove', handler)
  }, [])

  return (
    <div
      className="pointer-events-none fixed z-0 w-[600px] h-[600px] rounded-full bg-blue-600/5 blur-[120px] transition-transform duration-75"
      style={{ left: pos.x - 300, top: pos.y - 300 }}
    />
  )
}
