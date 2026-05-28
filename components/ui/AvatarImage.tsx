'use client'

import { useState } from 'react'
import Image from 'next/image'

interface Props {
  src: string | null | undefined
  alt: string
  size: number
  userId?: number
  className?: string
}

export default function AvatarImage({ src, alt, size, userId, className = '' }: Props) {
  const [imgSrc, setImgSrc] = useState(src)
  const [failed, setFailed] = useState(false)

  // 本地回退路径
  const localFallback = userId ? `/avatars/user_${userId}.jpg` : null

  if (!imgSrc || failed) {
    const initial = alt?.charAt(0)?.toUpperCase() || '?'
    return (
      <div className={`w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-400 to-purple-500 ${className}`}>
        <span className="text-white font-black" style={{ fontSize: size * 0.4 }}>{initial}</span>
      </div>
    )
  }

  return (
    <Image
      src={imgSrc}
      alt={alt}
      width={size}
      height={size}
      unoptimized
      className={`w-full h-full object-cover ${className}`}
      onError={() => {
        if (localFallback && imgSrc !== localFallback) {
          setImgSrc(localFallback)
        } else {
          setFailed(true)
        }
      }}
    />
  )
}
