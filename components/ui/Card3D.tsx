'use client'

import { useState } from 'react'

interface Card3DProps {
  children: React.ReactNode
  className?: string
}

export default function Card3D({ children, className = '' }: Card3DProps) {
  const [rotateX, setRotateX] = useState(0)
  const [rotateY, setRotateY] = useState(0)
  const [hovering, setHovering] = useState(false)

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    setRotateX((y - rect.height / 2) / 15)
    setRotateY((rect.width / 2 - x) / 15)
  }

  return (
    <div
      className={`transition-all duration-300 ease-out ${className}`}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => { setHovering(false); setRotateX(0); setRotateY(0) }}
      style={{
        transform: `perspective(1000px) rotateX(${hovering ? -rotateX : 0}deg) rotateY(${hovering ? rotateY : 0}deg) scale3d(${hovering ? 1.02 : 1}, ${hovering ? 1.02 : 1}, 1)`,
        boxShadow: hovering
          ? '0 20px 40px -10px rgba(0,0,0,0.1)'
          : '0 4px 6px -1px rgba(0,0,0,0.02)',
      }}
    >
      {children}
    </div>
  )
}
