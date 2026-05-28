'use client'

interface AvatarFrameProps {
  frameCssKey?: string | null
  shape?: 'circle' | 'rounded'
  size?: number
  className?: string
  children: React.ReactNode
}

/**
 * 渐变包裹型头像框：rose_gold, aurora, diamond
 * 用一层带渐变背景 + padding 的 div 包裹内容
 */
function GradientWrap({ gradient, children, shape, anim }: {
  gradient: string; children: React.ReactNode; shape: string; anim?: string
}) {
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 4,
        borderRadius: shape,
        background: gradient,
        animation: anim,
      }}
    >
      {children}
    </div>
  )
}

export default function AvatarFrame({ frameCssKey, shape = 'circle', size, className = '', children }: AvatarFrameProps) {
  if (!frameCssKey) return <>{children}</>

  const borderRadius = shape === 'circle' ? '50%' : '28px'

  // 渐变包裹型
  if (frameCssKey === 'rose_gold') {
    return (
      <GradientWrap gradient="linear-gradient(135deg, #f43f5e, #fbbf24, #f43f5e)" shape={borderRadius}>
        <div style={{ borderRadius, overflow: 'hidden' }}>{children}</div>
      </GradientWrap>
    )
  }

  if (frameCssKey === 'aurora') {
    return (
      <GradientWrap
        gradient="conic-gradient(from 0deg, #06b6d4, #8b5cf6, #ec4899, #f59e0b, #06b6d4)"
        shape={borderRadius}
        anim="aurora-spin 3s linear infinite"
      >
        <div style={{ borderRadius, overflow: 'hidden' }}>{children}</div>
      </GradientWrap>
    )
  }

  if (frameCssKey === 'diamond') {
    return (
      <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
        <div
          style={{
            position: 'absolute',
            inset: -4,
            borderRadius,
            background: 'conic-gradient(from 0deg, #f43f5e, #f59e0b, #10b981, #3b82f6, #8b5cf6, #f43f5e)',
            animation: 'aurora-spin 2s linear infinite',
            filter: 'blur(2px)',
          }}
        />
        <div style={{ borderRadius, overflow: 'hidden', position: 'relative' }}>{children}</div>
      </div>
    )
  }

  // box-shadow / outline 型：golden_ring, neon_blue, frost, flame
  return (
    <div
      className={`inline-flex items-center justify-center frame-${frameCssKey} ${className}`}
      style={{ borderRadius, overflow: 'visible' }}
    >
      <div style={{ borderRadius, overflow: 'hidden' }}>{children}</div>
    </div>
  )
}
