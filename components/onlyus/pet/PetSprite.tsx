'use client'

import { useEffect, useState, useRef } from 'react'
import type { Pet, SpriteFrame } from '@/stores/onlyus/petStore'
import { PET_TYPES, expForLevel } from '@/stores/onlyus/petStore'

interface Props {
  pet: Pet
}

function SpriteCanvas({ sprite, isPaused }: { sprite: SpriteFrame; isPaused?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const frameRef = useRef(0)
  const timerRef = useRef<number>(0)
  const framesRef = useRef<{ x: number; y: number; w: number; h: number }[]>([])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.src = sprite.url

    img.onload = () => {
      const frameW = img.width / sprite.cols
      const frameH = img.height / sprite.rows
      const totalFrames = sprite.cols * sprite.rows

      // Pre-calculate bounding box of non-transparent content per frame
      const offscreen = document.createElement('canvas')
      offscreen.width = frameW
      offscreen.height = frameH
      const offCtx = offscreen.getContext('2d')!

      const frames: { x: number; y: number; w: number; h: number }[] = []
      for (let i = 0; i < totalFrames; i++) {
        const col = i % sprite.cols
        const row = Math.floor(i / sprite.cols)
        offCtx.clearRect(0, 0, frameW, frameH)
        offCtx.drawImage(img, col * frameW, row * frameH, frameW, frameH, 0, 0, frameW, frameH)

        const pixels = offCtx.getImageData(0, 0, frameW, frameH).data
        let minX = frameW, minY = frameH, maxX = 0, maxY = 0
        let hasContent = false
        for (let py = 0; py < frameH; py++) {
          for (let px = 0; px < frameW; px++) {
            if (pixels[(py * frameW + px) * 4 + 3] > 10) {
              if (px < minX) minX = px
              if (px > maxX) maxX = px
              if (py < minY) minY = py
              if (py > maxY) maxY = py
              hasContent = true
            }
          }
        }
        if (hasContent) {
          frames.push({ x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 })
        } else {
          frames.push({ x: 0, y: 0, w: frameW, h: frameH })
        }
      }
      framesRef.current = frames

      // Canvas size = max bounding box dimensions across all frames
      const maxW = Math.max(...frames.map(f => f.w))
      const maxH = Math.max(...frames.map(f => f.h))
      canvas.width = maxW
      canvas.height = maxH

      const draw = () => {
        if (isPaused) return
        const idx = frameRef.current % totalFrames
        const col = idx % sprite.cols
        const row = Math.floor(idx / sprite.cols)
        const box = framesRef.current[idx]

        ctx.clearRect(0, 0, maxW, maxH)
        // Draw centered: offset so the content center aligns with canvas center
        const dx = Math.round((maxW - box.w) / 2 - box.x)
        const dy = Math.round((maxH - box.h) / 2 - box.y)
        ctx.drawImage(img, col * frameW, row * frameH, frameW, frameH, dx, dy, frameW, frameH)
        frameRef.current++
      }

      draw()
      timerRef.current = window.setInterval(draw, 1000 / (sprite.fps || 4))
    }

    return () => { clearInterval(timerRef.current) }
  }, [sprite.url, sprite.cols, sprite.rows, sprite.fps, isPaused])

  return (
    <canvas ref={canvasRef} style={{
      imageRendering: 'pixelated',
    }} />
  )
}

export default function PetSprite({ pet }: Props) {
  const [bounce, setBounce] = useState(false)
  const petInfo = PET_TYPES.find(t => t.key === pet.pet_type) || PET_TYPES[0]

  const isHappy = pet.happiness > 70
  const isHungry = pet.hunger < 30
  const hasCustomSprite = pet.custom_sprites && Object.keys(pet.custom_sprites).length > 0

  useEffect(() => {
    const interval = setInterval(() => setBounce(true), 3000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (bounce) {
      const t = setTimeout(() => setBounce(false), 600)
      return () => clearTimeout(t)
    }
  }, [bounce])

  const getAnimationStyle = (): React.CSSProperties => {
    if (isHungry) return { animation: 'pet-shake 0.8s ease-in-out infinite' }
    if (bounce || isHappy) return { animation: 'pet-bounce 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)' }
    return { animation: 'pet-breathe 3s ease-in-out infinite' }
  }

  // Pick the right sprite based on mood
  const getActiveSprite = (): SpriteFrame | null => {
    if (!hasCustomSprite) return null
    const sprites = pet.custom_sprites!
    if (isHappy && sprites.happy) return sprites.happy
    if (isHungry && sprites.hungry) return sprites.hungry
    if (sprites.idle) return sprites.idle
    return Object.values(sprites)[0] || null
  }

  const activeSprite = getActiveSprite()

  return (
    <>
      <style>{`
        @keyframes pet-breathe {
          0%, 100% { transform: scale(1) translateY(0); }
          50% { transform: scale(1.03) translateY(-4px); }
        }
        @keyframes pet-bounce {
          0% { transform: scale(1) translateY(0); }
          30% { transform: scale(1.1) translateY(-16px); }
          50% { transform: scale(0.95) translateY(0); }
          70% { transform: scale(1.05) translateY(-6px); }
          100% { transform: scale(1) translateY(0); }
        }
        @keyframes pet-shake {
          0%, 100% { transform: rotate(0); }
          25% { transform: rotate(-8deg); }
          75% { transform: rotate(8deg); }
        }
      `}</style>

      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        padding: '24px 0',
      }}>
        {/* Level badge */}
        <div style={{
          background: 'linear-gradient(135deg, #C4785A, #E8849C)',
          color: '#fff', padding: '3px 14px',
          borderRadius: 20, fontSize: 11,
          fontFamily: "'DM Sans', sans-serif",
          marginBottom: 12,
        }}>
          Lv.{pet.level}
        </div>

        {/* Pet display */}
        <div style={{
          width: 160, height: 160,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden',
        }}>
          {activeSprite ? (
            <div style={{ ...getAnimationStyle() }}>
              <SpriteCanvas sprite={activeSprite} />
            </div>
          ) : (
            <span style={{
              fontSize: 80,
              filter: isHungry ? 'grayscale(0.4)' : 'none',
              transition: 'filter 0.3s',
              ...getAnimationStyle(),
            }}>
              {petInfo.emoji}
            </span>
          )}
        </div>

        {/* Pet name */}
        <h2 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: 22, fontWeight: 400,
          color: '#3D2318', margin: '12px 0 4px',
        }}>{pet.name}</h2>

        {/* Status text */}
        <p style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 12, margin: 0,
          color: isHungry ? '#D4735E' : isHappy ? '#7BB87E' : 'rgba(61,35,24,0.4)',
        }}>
          {isHungry ? '好饿呀...' : isHappy ? '心情很好！' : '还不错~'}
        </p>

        {/* EXP bar */}
        <div style={{ width: '80%', marginTop: 12 }}>
          <div style={{
            height: 6, borderRadius: 3,
            background: 'rgba(155,142,196,0.15)',
            overflow: 'hidden',
          }}>
            <div style={{
              height: '100%', borderRadius: 3,
              background: 'linear-gradient(90deg, #9B8EC4, #C4A0E8)',
              width: `${(pet.exp / expForLevel(pet.level)) * 100}%`,
              transition: 'width 0.5s ease',
            }} />
          </div>
          <p style={{
            fontSize: 10, color: 'rgba(61,35,24,0.3)',
            fontFamily: "'DM Sans', sans-serif",
            margin: '3px 0 0', textAlign: 'center',
          }}>
            EXP {pet.exp} / {expForLevel(pet.level)}
          </p>
        </div>
      </div>
    </>
  )
}
