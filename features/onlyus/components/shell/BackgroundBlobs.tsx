'use client'

import { useEffect, useRef } from 'react'

// 轻量 canvas 光斑：用 requestAnimationFrame 极慢漂移
// 避免 CSS 动画在多个元素上的性能问题
export default function BackgroundBlobs() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef<number>(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let W = window.innerWidth
    let H = window.innerHeight
    canvas.width = W
    canvas.height = H

    const resize = () => {
      W = window.innerWidth
      H = window.innerHeight
      canvas.width = W
      canvas.height = H
    }
    window.addEventListener('resize', resize)

    // 4个光斑定义
    const blobs = [
      { x: W * 0.5,  y: H * 0.35, r: 380, vx: 0.08, vy: 0.05, c1: [196, 120, 90],  a: 0.07 },
      { x: W * 0.25, y: H * 0.65, r: 280, vx: -0.05, vy: -0.07, c1: [232, 132, 156], a: 0.055 },
      { x: W * 0.78, y: H * 0.55, r: 240, vx: 0.06,  vy: 0.08,  c1: [196, 120, 90],  a: 0.04 },
      { x: W * 0.15, y: H * 0.25, r: 200, vx: 0.04,  vy: -0.04, c1: [232, 132, 156], a: 0.035 },
    ]

    let t = 0

    const draw = () => {
      ctx.clearRect(0, 0, W, H)

      for (const blob of blobs) {
        // 极慢 Lissajous 漂移
        const ox = Math.sin(t * blob.vx * 0.6) * W * 0.06
        const oy = Math.cos(t * blob.vy * 0.6) * H * 0.06
        const cx = blob.x + ox
        const cy = blob.y + oy

        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, blob.r)
        const [r, g, b] = blob.c1
        grad.addColorStop(0,   `rgba(${r},${g},${b},${blob.a})`)
        grad.addColorStop(0.5, `rgba(${r},${g},${b},${blob.a * 0.4})`)
        grad.addColorStop(1,   `rgba(${r},${g},${b},0)`)

        ctx.fillStyle = grad
        ctx.beginPath()
        ctx.ellipse(cx, cy, blob.r, blob.r * 0.85, Math.sin(t * 0.01) * 0.3, 0, Math.PI * 2)
        ctx.fill()
      }

      t += 0.5
      rafRef.current = requestAnimationFrame(draw)
    }

    rafRef.current = requestAnimationFrame(draw)
    return () => {
      cancelAnimationFrame(rafRef.current)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed', inset: 0, zIndex: 0,
        pointerEvents: 'none', opacity: 0.9,
      }}
    />
  )
}
