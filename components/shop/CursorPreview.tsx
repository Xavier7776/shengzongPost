'use client'

import { memo, useState } from 'react'
import type { CursorEffect } from './cursorTypes'

/**
 * 商城/管理页内的鼠标效果预览（全部静态，绝不闪）。
 *
 * 渲染优先级：
 * 1. poster_url — 源站 codex-pets.net 提供的静态海报图（sprite_sheet 模式）
 * 2. sprite_url — GIF 模式直接用 <img> 自播放（img 元素不闪）
 * 3. emoji — 兜底，CSS bob 动画（transform 不闪）
 *
 * 不再使用 SpriteCanvas：多实例 canvas clearRect+drawImage 在合成器采样间隙会闪烁。
 * 全局跟随 CursorFollower 仍用 SpriteCanvas（单实例 + RAF，不闪）。
 */
function CursorPreview({ effect, size = 48 }: { effect: CursorEffect; size?: number }) {
  const [imgError, setImgError] = useState(false)
  const h = size
  const w = Math.round(size * effect.frame_width / effect.frame_height)

  // 优先用 poster 静态图
  const posterSrc = effect.poster_url
  const gifSrc = effect.render_type === 'gif' ? effect.sprite_url : null
  const imgSrc = !imgError ? (posterSrc ?? gifSrc) : null

  if (imgSrc) {
    return (
      <div style={{ width: w, height: h, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imgSrc}
          alt={effect.name}
          style={{ width: w, height: h, objectFit: 'contain', imageRendering: 'auto' }}
          draggable={false}
          onError={() => setImgError(true)}
        />
      </div>
    )
  }

  // 兜底：emoji 静态显示 + CSS bob 动画
  return (
    <div
      style={{
        width: size, height: size,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: size * 0.8,
        animation: 'cursor-preview-bob 1.6s ease-in-out infinite',
      }}
    >
      {effect.emoji}
      <style>{`@keyframes cursor-preview-bob { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-3px)} }`}</style>
    </div>
  )
}

export default memo(CursorPreview)
