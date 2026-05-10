'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useRef, useState } from 'react'

export default function FooterLogo() {
  const router = useRouter()
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>()
  const [spinning, setSpinning] = useState(false)
  const counterRef = useRef(0)

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const id = ++counterRef.current

    setRipples(prev => [...(prev ?? []), { id, x, y }])
    setSpinning(true)
    setTimeout(() => setRipples(prev => prev?.filter(r => r.id !== id)), 600)
    setTimeout(() => {
      setSpinning(false)
      router.push('/onlyus')
    }, 400)
  }

  return (
    <Link
      href="/onlyus"
      aria-label="OnlyUs"
      onClick={handleClick}
      style={{ position: 'relative', display: 'inline-block', borderRadius: '50%', overflow: 'visible' }}
    >
      {/* 涟漪层 */}
      <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', overflow: 'hidden', pointerEvents: 'none' }}>
        {ripples?.map(r => (
          <span
            key={r.id}
            style={{
              position: 'absolute',
              left: r.x,
              top: r.y,
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: 'rgba(99,102,241,0.35)',
              transform: 'translate(-50%,-50%) scale(0)',
              animation: 'logo-ripple 0.6s ease-out forwards',
              pointerEvents: 'none',
            }}
          />
        ))}
      </span>

      <Image
        src="/logo.png"
        alt="MindStack"
        width={32}
        height={32}
        style={{
          borderRadius: '50%',
          transition: 'transform 0.4s cubic-bezier(0.34,1.56,0.64,1)',
          transform: spinning ? 'rotate(360deg) scale(1.15)' : 'rotate(0deg) scale(1)',
          display: 'block',
        }}
      />

      <style>{`
        @keyframes logo-ripple {
          to { transform: translate(-50%,-50%) scale(7); opacity: 0; }
        }
      `}</style>
    </Link>
  )
}
