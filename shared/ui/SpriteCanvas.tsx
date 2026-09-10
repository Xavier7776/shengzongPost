'use client'

import { useEffect, useRef } from 'react'

export interface SpriteFrame {
  url: string
  cols: number
  rows: number
  fps: number
}

interface Props {
  sprite: SpriteFrame
  /** 指定后只播放该行的 cols 帧（多状态精灵图）；不传则播放全部 cols*rows 帧（原 PetSprite 行为） */
  row?: number
  isPaused?: boolean
  /** 固定渲染尺寸（宽）；不传则按内容包围盒自适应 */
  width?: number
  /** 固定渲染尺寸（高）；不传则按内容包围盒自适应 */
  height?: number
}

export default function SpriteCanvas({ sprite, row, isPaused, width, height }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  // 通过 ref 读取频繁变化的 row / isPaused，避免重新加载图片与重算包围盒
  const rowRef = useRef<number | undefined>(row)
  const pausedRef = useRef<boolean>(!!isPaused)

  useEffect(() => { rowRef.current = row }, [row])
  useEffect(() => { pausedRef.current = !!isPaused }, [isPaused])

  // 主 effect：仅在 sprite 本身或固定尺寸变化时重跑（加载图 + 算包围盒 + 启动循环）
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const fixedMode = typeof width === 'number' && typeof height === 'number'

    let timer = 0
    let cancelled = false
    let frameIdx = 0
    const img = new Image()

    img.onload = () => {
      if (cancelled) return
      const frameW = img.width / sprite.cols
      const frameH = img.height / sprite.rows
      const totalFrames = sprite.cols * sprite.rows
      if (frameW < 1 || frameH < 1) return

      // ---- 画布尺寸 + 包围盒（仅非固定模式需要）----
      let cw: number, ch: number
      let boxes: { x: number; y: number; w: number; h: number }[] = []

      if (fixedMode) {
        cw = width!
        ch = height!
        // 固定模式跳过包围盒计算：用帧尺寸做统一缩放，避免每帧 scale 不同导致闪烁
      } else {
        const bboxCanvas = document.createElement('canvas')
        bboxCanvas.width = frameW
        bboxCanvas.height = frameH
        const bboxCtx = bboxCanvas.getContext('2d')
        if (!bboxCtx) return

        for (let i = 0; i < totalFrames; i++) {
          const c = i % sprite.cols
          const r = Math.floor(i / sprite.cols)
          bboxCtx.clearRect(0, 0, frameW, frameH)
          bboxCtx.drawImage(img, c * frameW, r * frameH, frameW, frameH, 0, 0, frameW, frameH)

          let pixels: Uint8ClampedArray
          try {
            pixels = bboxCtx.getImageData(0, 0, frameW, frameH).data
          } catch {
            boxes.push({ x: 0, y: 0, w: frameW, h: frameH })
            continue
          }
          let minX = frameW, minY = frameH, maxX = 0, maxY = 0, hasContent = false
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
          boxes.push(hasContent
            ? { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 }
            : { x: 0, y: 0, w: frameW, h: frameH })
        }

        const rowMode = typeof rowRef.current === 'number'
        const indices = rowMode
          ? Array.from({ length: sprite.cols }, (_, i) => (rowRef.current ?? 0) * sprite.cols + i)
          : Array.from({ length: totalFrames }, (_, i) => i)
        cw = Math.max(...indices.map(i => boxes[i].w))
        ch = Math.max(...indices.map(i => boxes[i].h))
      }

      // canvas.width 守卫：即使值不变，赋值也会重置 bitmap 清空整帧 → 闪烁
      // 只在尺寸真正变化时才赋值
      if (canvas.width !== cw) canvas.width = cw
      if (canvas.height !== ch) canvas.height = ch

      // ---- 固定模式：预计算统一缩放参数，所有帧共用 ----
      const fixedScale = fixedMode ? Math.min(cw / frameW, ch / frameH) : 0
      const fixedDw = frameW * fixedScale
      const fixedDh = frameH * fixedScale
      const fixedDx = (cw - fixedDw) / 2
      const fixedDy = (ch - fixedDh) / 2

      // ---- 双缓冲：离屏 canvas ----
      // 在离屏 canvas 完成 clearRect + drawImage（中间态不可见），
      // 再用 globalCompositeOperation='copy' 一次性原子替换显示 canvas 的所有像素，
      // 杜绝合成器采样到 "已 clear 未 draw" 的透明中间态。
      const offscreen = document.createElement('canvas')
      offscreen.width = cw
      offscreen.height = ch
      const offCtx = offscreen.getContext('2d')
      if (!offCtx) return

      const draw = () => {
        if (pausedRef.current) return
        const useRow = rowRef.current
        const useRowMode = typeof useRow === 'number'
        const idx = useRowMode
          ? useRow * sprite.cols + (frameIdx % sprite.cols)
          : frameIdx % totalFrames
        const col = idx % sprite.cols
        const r = Math.floor(idx / sprite.cols)

        // 1) 在离屏 canvas 画完整帧（clearRect + drawImage，中间态不可见）
        offCtx.clearRect(0, 0, cw, ch)
        if (fixedMode) {
          offCtx.drawImage(img, col * frameW, r * frameH, frameW, frameH, fixedDx, fixedDy, fixedDw, fixedDh)
        } else {
          const box = boxes[idx]
          offCtx.drawImage(img, col * frameW, r * frameH, frameW, frameH, Math.round((cw - box.w) / 2 - box.x), Math.round((ch - box.h) / 2 - box.y), frameW, frameH)
        }

        // 2) 原子替换显示 canvas：'copy' 模式让 offscreen 完全替换当前 bitmap（含 alpha）
        //    显示 canvas 只有一次 drawImage 操作，合成器不可能抓到中间态
        ctx.globalCompositeOperation = 'copy'
        ctx.drawImage(offscreen, 0, 0)
        ctx.globalCompositeOperation = 'source-over' // 恢复默认，避免影响后续绘制

        frameIdx++
      }

      // 用 requestAnimationFrame 替代 setInterval：
      // 1) 与浏览器 vsync 同步，避免 clearRect 落在合成间隙导致白帧闪烁
      // 2) 多实例（商城/管理页 20+ 个 canvas）时所有重绘统一在一帧内完成，不会互相抢占合成
      const frameInterval = 1000 / (sprite.fps || 4)
      let lastTime = 0
      const loop = (now: number) => {
        if (cancelled) return
        if (now - lastTime >= frameInterval) {
          lastTime = now - (now - lastTime) % frameInterval // 累积误差补偿
          draw()
        }
        timer = requestAnimationFrame(loop)
      }

      draw() // 立即画第一帧
      timer = requestAnimationFrame(loop)
    }

    img.src = sprite.url
    return () => {
      cancelled = true
      cancelAnimationFrame(timer)
      img.onload = null
    }
    // row / isPaused 故意不进依赖（通过 ref 读取），方向切换不重载图片
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sprite.url, sprite.cols, sprite.rows, sprite.fps, width, height])

  return (
    <canvas ref={canvasRef} style={{ imageRendering: 'pixelated', display: 'block' }} />
  )
}
