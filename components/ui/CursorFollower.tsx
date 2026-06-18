'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useSession } from 'next-auth/react'
import SpriteCanvas, { type SpriteFrame } from './SpriteCanvas'

/** 从 /api/user/profile 拿到的装备态（仅需要的字段） */
interface EquippedEffect {
  key: string
  sprite_url: string | null
  cols: number
  rows: number
  fps: number
  frame_width: number
  frame_height: number
  scale: number
  follow_easing: number
  state_map: string
  emoji: string
  render_type: 'sprite_sheet' | 'gif'
}

type MotionState = 'idle' | 'runRight' | 'runLeft'

/** 解析 state_map JSON，取运动状态对应的行号，缺省回退 idle(0) */
function resolveRow(stateMap: string, state: MotionState): number {
  try {
    const map = JSON.parse(stateMap) as Record<string, number>
    if (state === 'runRight' && typeof map.runRight === 'number') return map.runRight
    if (state === 'runLeft' && typeof map.runLeft === 'number') return map.runLeft
    return typeof map.idle === 'number' ? map.idle : 0
  } catch {
    return 0
  }
}

export default function CursorFollower() {
  const { status } = useSession()
  const [effect, setEffect] = useState<EquippedEffect | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (status !== 'authenticated') return
    // 触屏 / 无精确指针设备不渲染
    if (typeof window !== 'undefined' && !window.matchMedia('(pointer: fine)').matches) {
      setReady(true)
      return
    }
    let cancelled = false
    fetch('/api/user/profile', { cache: 'no-store' })
      .then(r => r.json())
      .then(d => { if (!cancelled) setEffect(d.equipped_cursor_effect ?? null) })
      .catch(() => {}) // 静默失败
      .finally(() => { if (!cancelled) setReady(true) })
    return () => { cancelled = true }
  }, [status])

  if (!ready || !effect) return null
  return <FollowerLayer effect={effect} />
}

function FollowerLayer({ effect }: { effect: EquippedEffect }) {
  const wrapRef = useRef<HTMLDivElement>(null)
  // 初始位置放在屏幕中心，避免鼠标不动时角色永远在屏幕外
  const initX = typeof window !== 'undefined' ? window.innerWidth / 2 : 400
  const initY = typeof window !== 'undefined' ? window.innerHeight / 2 : 300
  const target = useRef({ x: initX, y: initY })
  const current = useRef({ x: initX, y: initY })
  const lastMoveAt = useRef(0)
  const lastDx = useRef(0)
  const hasMoved = useRef(false)
  const motionRef = useRef<MotionState>('idle')
  const [motion, setMotion] = useState<MotionState>('idle')
  const rafRef = useRef(0)

  // 光标右下偏移，避免遮挡指针
  const OFFSET_X = 24
  const OFFSET_Y = 24
  // 静止超过该毫秒数判定为 idle
  const IDLE_MS = 400

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const easing = effect.follow_easing || 0.12

    const onMove = (e: MouseEvent) => {
      const dx = e.clientX - target.current.x
      if (Math.abs(dx) > 1) lastDx.current = dx
      // 第一次移动直接 snap 到光标，避免从屏幕中心慢慢飘过来
      if (!hasMoved.current) {
        hasMoved.current = true
        current.current = { x: e.clientX, y: e.clientY }
      }
      target.current = { x: e.clientX, y: e.clientY }
      lastMoveAt.current = performance.now()
      if (reduced) {
        current.current = { x: e.clientX, y: e.clientY }
        apply(e.clientX, e.clientY)
      }
    }
    window.addEventListener('mousemove', onMove, { passive: true })

    const apply = (x: number, y: number) => {
      const el = wrapRef.current
      if (!el) return
      el.style.transform = `translate3d(${x + OFFSET_X}px, ${y + OFFSET_Y}px, 0)`
    }

    const loop = () => {
      const now = performance.now()
      // 运动状态判定
      let st: MotionState
      if (now - lastMoveAt.current > IDLE_MS || !hasMoved.current) {
        st = 'idle'
      } else if (lastDx.current > 1) {
        st = 'runRight'
      } else if (lastDx.current < -1) {
        st = 'runLeft'
      } else {
        st = 'idle'
      }
      if (st !== motionRef.current) {
        motionRef.current = st
        setMotion(st)
      }

      if (!reduced) {
        // lerp 平滑跟随
        current.current.x += (target.current.x - current.current.x) * easing
        current.current.y += (target.current.y - current.current.y) * easing
        apply(current.current.x, current.current.y)
      }
      rafRef.current = requestAnimationFrame(loop)
    }

    // 立即定位，避免首帧停留在左上角
    apply(current.current.x, current.current.y)
    if (!reduced) {
      rafRef.current = requestAnimationFrame(loop)
    }

    const onVis = () => {
      if (document.visibilityState === 'hidden') {
        cancelAnimationFrame(rafRef.current)
      } else if (!reduced) {
        rafRef.current = requestAnimationFrame(loop)
      }
    }
    document.addEventListener('visibilitychange', onVis)

    return () => {
      window.removeEventListener('mousemove', onMove)
      document.removeEventListener('visibilitychange', onVis)
      cancelAnimationFrame(rafRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effect])

  const hasSprite = !!effect.sprite_url
  const isGif = effect.render_type === 'gif' && hasSprite
  // 固定渲染尺寸：高 = scale，宽按帧宽高比推算
  const h = effect.scale
  const w = Math.round(effect.scale * effect.frame_width / effect.frame_height)
  // codex-pets 资产用 runRight/runLeft 行自带朝向，不做 CSS 翻转；emoji 兜底才翻转
  // GIF 模式无方向状态，不翻转
  const flip = !hasSprite && motion === 'runLeft' ? -1 : 1
  const row = hasSprite && !isGif ? resolveRow(effect.state_map, motion) : 0

  const sprite = useMemo<SpriteFrame>(
    () => ({ url: effect.sprite_url!, cols: effect.cols, rows: effect.rows, fps: effect.fps }),
    [effect.sprite_url, effect.cols, effect.rows, effect.fps]
  )

  return (
    <div
      ref={wrapRef}
      className="pointer-events-none fixed z-40 left-0 top-0 will-change-transform"
      style={{ width: w, height: h }}
    >
      {isGif ? (
        // GIF 模式：直接 <img> 自播放，无方向状态
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={effect.sprite_url!}
          alt=""
          draggable={false}
          style={{ width: w, height: h, objectFit: 'contain', pointerEvents: 'none' }}
        />
      ) : hasSprite ? (
        <SpriteCanvas
          sprite={sprite}
          row={row}
          width={w}
          height={h}
        />
      ) : (
        <EmojiFallback emoji={effect.emoji} size={h} flip={flip} idle={motion === 'idle'} />
      )}
    </div>
  )
}

function EmojiFallback({ emoji, size, flip, idle }: { emoji: string; size: number; flip: number; idle: boolean }) {
  return (
    <div
      style={{
        width: size, height: size,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transform: `scaleX(${flip})`,
      }}
    >
      <span
        style={{
          fontSize: size * 0.85,
          display: 'inline-block',
          animation: idle ? 'cursor-bob 1.6s ease-in-out infinite' : 'none',
          filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.15))',
        }}
      >
        {emoji}
      </span>
      <style>{`@keyframes cursor-bob { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }`}</style>
    </div>
  )
}
