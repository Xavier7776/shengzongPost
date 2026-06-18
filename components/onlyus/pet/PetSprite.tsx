'use client'

import { useEffect, useState } from 'react'
import type { Pet, SpriteFrame } from '@/stores/onlyus/petStore'
import { PET_TYPES, expForLevel } from '@/stores/onlyus/petStore'
import SpriteCanvas from '@/components/ui/SpriteCanvas'

interface Props {
  pet: Pet
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
