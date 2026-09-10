'use client'

import { useEffect, useRef } from 'react'

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  opacity: number
  opacitySpeed: number
  color: string
  life: number
  maxLife: number
}

export default function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>(0)
  const particlesRef = useRef<Particle[]>([])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const palette = [
      'rgba(196,120,90,',   // #C4785A
      'rgba(232,132,156,',  // #E8849C
      'rgba(242,169,138,',  // #F2A98A
      'rgba(232,196,184,',  // #E8C4B8
      'rgba(255,240,234,',  // light peach
    ]

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const createParticle = (): Particle => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.3,
      vy: -Math.random() * 0.4 - 0.1,
      size: Math.random() * 2.5 + 0.5,
      opacity: 0,
      opacitySpeed: Math.random() * 0.008 + 0.003,
      color: palette[Math.floor(Math.random() * palette.length)],
      life: 0,
      maxLife: Math.random() * 300 + 150,
    })

    // 初始粒子
    for (let i = 0; i < 60; i++) {
      const p = createParticle()
      p.life = Math.random() * p.maxLife
      p.opacity = Math.random() * 0.5
      particlesRef.current.push(p)
    }

    const animate = () => {
      animRef.current = requestAnimationFrame(animate)
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      particlesRef.current.forEach((p, i) => {
        p.x += p.vx
        p.y += p.vy
        p.life++

        const halfLife = p.maxLife / 2
        if (p.life < halfLife) {
          p.opacity = Math.min(p.opacity + p.opacitySpeed, 0.6)
        } else {
          p.opacity = Math.max(p.opacity - p.opacitySpeed * 0.8, 0)
        }

        if (p.life >= p.maxLife || p.y < -10) {
          particlesRef.current[i] = createParticle()
          return
        }

        // 绘制萤火虫
        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 3)
        gradient.addColorStop(0, `${p.color}${p.opacity})`)
        gradient.addColorStop(0.4, `${p.color}${p.opacity * 0.5})`)
        gradient.addColorStop(1, `${p.color}0)`)

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2)
        ctx.fillStyle = gradient
        ctx.fill()

        // 核心亮点
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size * 0.5, 0, Math.PI * 2)
        ctx.fillStyle = `${p.color}${Math.min(p.opacity * 2, 1)})`
        ctx.fill()
      })

      // 补充粒子
      if (particlesRef.current.length < 60) {
        particlesRef.current.push(createParticle())
      }
    }
    animate()

    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(animRef.current)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  )
}
