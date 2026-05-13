'use client'

import type { Pet } from '@/stores/onlyus/petStore'

interface Props {
  pet: Pet
}

function StatBar({ label, value, color }: { label: string; value: number; color: string }) {
  const getColor = () => {
    if (value > 60) return color
    if (value > 30) return '#D4A05E'
    return '#D4735E'
  }

  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', marginBottom: 4,
      }}>
        <span style={{
          fontSize: 11, fontFamily: "'DM Sans', sans-serif",
          color: 'rgba(61,35,24,0.5)',
        }}>{label}</span>
        <span style={{
          fontSize: 11, fontFamily: "'DM Sans', sans-serif",
          color: 'rgba(61,35,24,0.4)',
        }}>{value}%</span>
      </div>
      <div style={{
        height: 8, borderRadius: 4,
        background: 'rgba(196,120,90,0.08)',
        overflow: 'hidden',
      }}>
        <div style={{
          height: '100%', borderRadius: 4,
          background: getColor(),
          width: `${value}%`,
          transition: 'width 0.5s ease, background 0.3s',
        }} />
      </div>
    </div>
  )
}

export default function PetStats({ pet }: Props) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.55)',
      backdropFilter: 'blur(16px)',
      borderRadius: 16,
      border: '1px solid rgba(196,120,90,0.1)',
      padding: '16px 20px',
    }}>
      <StatBar label="心情" value={pet.happiness} color="#7BB87E" />
      <StatBar label="饱食" value={pet.hunger} color="#7EB8D4" />
    </div>
  )
}
