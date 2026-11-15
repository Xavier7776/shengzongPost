'use client'

import { useRef, useEffect } from 'react'

export default function CursorGlow() {
  const glowRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const glow = glowRef.current
    if (!glow) return
    const pointer = window.matchMedia('(pointer: fine)')
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
    let frame: number | null = null
    let x = 0, y = 0
    const hide = () => {
      if (frame !== null) cancelAnimationFrame(frame)
      frame = null
      glow.hidden = true
    }
    const handler = (event: MouseEvent) => {
      x = event.clientX
      y = event.clientY
      if (frame !== null) return
      frame = requestAnimationFrame(() => {
        frame = null
        glow.style.transform = `translate3d(${x - 300}px, ${y - 300}px, 0)`
        glow.hidden = false
      })
    }
    const sync = () => {
      window.removeEventListener('mousemove', handler)
      hide()
      if (pointer.matches && !motion.matches) {
        window.addEventListener('mousemove', handler, { passive: true })
      }
    }
    sync()
    pointer.addEventListener('change', sync)
    motion.addEventListener('change', sync)
    document.documentElement.addEventListener('mouseleave', hide)
    return () => {
      window.removeEventListener('mousemove', handler)
      pointer.removeEventListener('change', sync)
      motion.removeEventListener('change', sync)
      document.documentElement.removeEventListener('mouseleave', hide)
      hide()
    }
  }, [])

  return (
    <div
      ref={glowRef}
      hidden
      aria-hidden="true"
      className="pointer-events-none fixed left-0 top-0 z-0 w-[600px] h-[600px] rounded-full bg-blue-600/5 blur-[120px]"
    />
  )
}
