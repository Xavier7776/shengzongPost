'use client'

import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'

/**
 * CSS background-position + steps() 精灵图渲染器。
 *
 * 相比 canvas 方案的优势：
 * 1. 帧步进由浏览器原生 steps() 函数处理，不存在 clearRect+drawImage 间隙 → 永不闪烁
 * 2. 动画声明在 CSS 中，浏览器可做内部优化（will-change 提示合成层提升）
 * 3. 切换 row（方向/状态）通过 setRow 直接操作 DOM，不触发 React 重渲染
 *
 * 关键修复：运行时检测每行有效帧数。
 * codex-pets 精灵图每行帧数不同（idle=6, run=8），但 cols=8。
 * 如果用 steps(8) 播放 idle 行，会扫过 2 个空白帧 → 闪烁。
 * 解决：加载图片后扫描每行非透明像素，用实际帧数设置 steps 和 end-x。
 */

export interface SpriteFrame {
  url: string
  cols: number
  rows: number
  fps: number
}

export interface SpriteCSSHandle {
  /** 切换到指定行（状态/方向），自动用该行的有效帧数 */
  setRow: (row: number) => void
}

interface Props {
  sprite: SpriteFrame
  /** 精灵图中的行号（状态/方向），仅用于初始渲染 */
  row?: number
  /** 单帧原始宽度（像素） */
  frameWidth: number
  /** 单帧原始高度（像素） */
  frameHeight: number
  /** 渲染宽度 */
  width: number
  /** 渲染高度 */
  height: number
  isPaused?: boolean
}

/**
 * 检测精灵图每行的有效帧数（从左到右扫描，遇到空白帧停止）。
 * 返回数组：rowFrames[row] = 该行的有效帧数。
 */
function detectRowFrames(
  img: HTMLImageElement,
  cols: number,
  rows: number,
  frameW: number,
  frameH: number
): number[] {
  const canvas = document.createElement('canvas')
  canvas.width = frameW
  canvas.height = frameH
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) return Array(rows).fill(cols)

  const result: number[] = []
  for (let r = 0; r < rows; r++) {
    let frames = 0
    for (let c = 0; c < cols; c++) {
      ctx.clearRect(0, 0, frameW, frameH)
      ctx.drawImage(img, c * frameW, r * frameH, frameW, frameH, 0, 0, frameW, frameH)
      try {
        const data = ctx.getImageData(0, 0, frameW, frameH).data
        let hasContent = false
        for (let i = 3; i < data.length; i += 4) {
          if (data[i] > 10) { hasContent = true; break }
        }
        if (hasContent) {
          frames++
        } else {
          break // 遇到空白帧就停止（帧是连续排列的）
        }
      } catch {
        frames = cols
        break
      }
    }
    result.push(Math.max(frames, 1)) // 至少 1 帧
  }
  return result
}

const SpriteCSS = forwardRef<SpriteCSSHandle, Props>(function SpriteCSS(
  {
    sprite,
    row = 0,
    frameWidth,
    frameHeight,
    width,
    height,
    isPaused = false,
  },
  ref
) {
  const elRef = useRef<HTMLDivElement>(null)
  const rowFramesRef = useRef<number[]>([])
  const currentRowRef = useRef(row)

  const sheetWidth = sprite.cols * frameWidth
  const sheetHeight = sprite.rows * frameHeight
  const scaleX = width / frameWidth
  const scaleY = height / frameHeight

  /** 应用指定行：设置 backgroundPosition + animation（用该行实际帧数） */
  const applyRow = (r: number) => {
    currentRowRef.current = r
    const el = elRef.current
    if (!el) return
    const frames = rowFramesRef.current[r] ?? sprite.cols
    const duration = Math.max((frames / (sprite.fps || 4)) * 1000, 800)
    const endX = -frames * frameWidth
    const yPos = r * -frameHeight

    el.style.backgroundPosition = `0 ${yPos}px`
    el.style.setProperty('--sprite-y', `${yPos}px`)
    el.style.setProperty('--sprite-end-x', `${endX}px`)
    el.style.animation = `sprite-play ${duration}ms steps(${frames}) infinite`
    el.style.animationPlayState = isPaused ? 'paused' : 'running'
  }

  // 加载图片 → 检测每行帧数 → 应用初始行
  useEffect(() => {
    let cancelled = false
    const img = new Image()
    img.onload = () => {
      if (cancelled) return
      rowFramesRef.current = detectRowFrames(
        img,
        sprite.cols,
        sprite.rows,
        frameWidth,
        frameHeight
      )
      applyRow(currentRowRef.current)
    }
    img.src = sprite.url
    return () => { cancelled = true; img.onload = null }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sprite.url, sprite.cols, sprite.rows, frameWidth, frameHeight])

  // isPaused 变化时更新
  useEffect(() => {
    const el = elRef.current
    if (el) el.style.animationPlayState = isPaused ? 'paused' : 'running'
  }, [isPaused])

  useImperativeHandle(ref, () => ({
    setRow: (r: number) => applyRow(r),
    // applyRow 依赖 ref（稳定引用），不需要进依赖数组
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [])

  return (
    <div
      ref={elRef}
      style={{
        width: frameWidth,
        height: frameHeight,
        backgroundImage: `url(${sprite.url})`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: `0 ${row * -frameHeight}px`,
        backgroundSize: `${sheetWidth}px ${sheetHeight}px`,
        imageRendering: 'pixelated',
        transform: `scale(${scaleX}, ${scaleY})`,
        transformOrigin: 'top left',
        willChange: 'background-position',
        '--sprite-y': `${row * -frameHeight}px`,
        '--sprite-end-x': `${-sheetWidth}px`,
      } as React.CSSProperties}
    />
  )
})

export default SpriteCSS
