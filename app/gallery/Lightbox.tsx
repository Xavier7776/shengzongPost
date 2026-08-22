'use client'

// app/gallery/Lightbox.tsx
// 全新灯箱：滚轮/双击缩放、拖拽平移、触摸滑动翻页、键盘导航、
// 相邻预加载、信息面板、点赞、复制链接

import { useCallback, useEffect, useRef, useState } from 'react'
import { X, ChevronLeft, ChevronRight, Heart, Share2, Info, Maximize2 } from 'lucide-react'
import { blurPlaceholder, type GalleryItem } from './types'

const LIKED_KEY = 'gallery_liked_ids'
const MIN_SCALE = 1
const MAX_SCALE = 4

function getLikedIds(): Set<number> {
  try {
    return new Set(JSON.parse(localStorage.getItem(LIKED_KEY) || '[]') as number[])
  } catch {
    return new Set()
  }
}

export default function Lightbox({
  images,
  currentId,
  onClose,
  onNavigate,
}: {
  images: GalleryItem[]
  currentId: number
  onClose: () => void
  onNavigate: (id: number) => void
}) {
  const index = Math.max(0, images.findIndex(i => i.id === currentId))
  const img = images[index]

  const [scale, setScale] = useState(MIN_SCALE)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [showInfo, setShowInfo] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [likes, setLikes] = useState(img?.likes ?? 0)
  const [liked, setLiked] = useState(false)
  const [copied, setCopied] = useState(false)
  const dragRef = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null)
  const touchRef = useRef<{ x: number; y: number } | null>(null)

  const imgId = img?.id
  useEffect(() => {
    if (imgId !== undefined) setLiked(getLikedIds().has(imgId))
  }, [imgId])

  // 切换图片时重置变换
  useEffect(() => {
    setScale(MIN_SCALE)
    setOffset({ x: 0, y: 0 })
    setLoaded(false)
    setLikes(images[index]?.likes ?? 0)
  }, [index, images])

  const go = useCallback(
    (delta: number) => {
      const next = images[index + delta]
      if (next) onNavigate(next.id)
    },
    [images, index, onNavigate]
  )

  // 键盘
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft' && scale === MIN_SCALE) go(-1)
      if (e.key === 'ArrowRight' && scale === MIN_SCALE) go(1)
      if (e.key === 'i') setShowInfo(v => !v)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose, go, scale])

  // 相邻预加载
  useEffect(() => {
    ;[images[index - 1], images[index + 1]].forEach(n => {
      if (n) { const pre = new Image(); pre.src = n.url }
    })
  }, [index, images])

  const clampOffset = useCallback((o: { x: number; y: number }, s: number) => ({
    x: Math.max(-(s - 1) * window.innerWidth / 2, Math.min((s - 1) * window.innerWidth / 2, o.x)),
    y: Math.max(-(s - 1) * window.innerHeight / 2, Math.min((s - 1) * window.innerHeight / 2, o.y)),
  }), [])

  const zoomAt = useCallback((factor: number, cx?: number, cy?: number) => {
    setScale(prev => {
      const next = Math.min(MAX_SCALE, Math.max(MIN_SCALE, prev * factor))
      if (next === prev) return prev
      if (next === MIN_SCALE) { setOffset({ x: 0, y: 0 }); return next }
      setOffset(o => {
        const px = cx ?? window.innerWidth / 2
        const py = cy ?? window.innerHeight / 2
        return clampOffset({
          x: o.x - (px - window.innerWidth / 2) * (next / prev - 1),
          y: o.y - (py - window.innerHeight / 2) * (next / prev - 1),
        }, next)
      })
      return next
    })
  }, [clampOffset])

  // 滚轮缩放：必须用原生非 passive 监听（React 合成 onWheel 是 passive 的，preventDefault 无效）
  const containerRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const handler = (e: WheelEvent) => {
      e.preventDefault()
      zoomAt(e.deltaY < 0 ? 1.25 : 0.8, e.clientX, e.clientY)
    }
    el.addEventListener('wheel', handler, { passive: false })
    return () => el.removeEventListener('wheel', handler)
  }, [zoomAt])

  if (!img) return null

  const onDoubleClick = (e: React.MouseEvent) => {
    zoomAt(scale >= MAX_SCALE ? 1 / MAX_SCALE : 2, e.clientX, e.clientY)
  }

  // 拖拽平移（放大时）
  const onMouseDown = (e: React.MouseEvent) => {
    if (scale <= MIN_SCALE) return
    dragRef.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y }
  }
  const onMouseMove = (e: React.MouseEvent) => {
    const d = dragRef.current
    if (!d) return
    setOffset(clampOffset({ x: d.ox + (e.clientX - d.x), y: d.oy + (e.clientY - d.y) }, scale))
  }
  const endDrag = () => { dragRef.current = null }

  // 触摸滑动（未放大时翻页）
  const onTouchStart = (e: React.TouchEvent) => {
    if (scale > MIN_SCALE) return
    const t = e.touches[0]
    touchRef.current = { x: t.clientX, y: t.clientY }
  }
  const onTouchEnd = (e: React.TouchEvent) => {
    const t = touchRef.current
    if (!t || scale > MIN_SCALE) return
    const dx = e.changedTouches[0].clientX - t.x
    const dy = e.changedTouches[0].clientY - t.y
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy)) go(dx < 0 ? 1 : -1)
    touchRef.current = null
  }

  const handleLike = async () => {
    if (liked) return
    const ids = getLikedIds()
    ids.add(img.id)
    localStorage.setItem(LIKED_KEY, JSON.stringify(Array.from(ids)))
    setLiked(true)
    setLikes(l => l + 1)
    try {
      await fetch(`/api/gallery/${img.id}/like`, { method: 'POST' })
    } catch { /* 静默失败，UI 已乐观更新 */ }
  }

  const handleShare = async () => {
    const url = `${location.origin}/gallery?image=${img.id}`
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch { /* 剪贴板不可用时静默 */ }
  }

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[200] flex flex-col bg-[#0a0a0c]/98 backdrop-blur-2xl animate-lb-fade"
      onClick={scale <= MIN_SCALE ? onClose : undefined}
    >
      {/* 顶栏 */}
      <div className="absolute top-0 inset-x-0 z-20 flex items-center justify-between px-5 py-4 bg-gradient-to-b from-black/50 to-transparent">
        <span className="font-mono text-[11px] tracking-[0.35em] text-white/40 select-none">
          {String(index + 1).padStart(2, '0')} / {String(images.length).padStart(2, '0')}
        </span>
        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
          <IconBtn label="缩放" onClick={() => zoomAt(scale >= MAX_SCALE ? 1 / MAX_SCALE : 2)}>
            <Maximize2 className="w-4 h-4" />
          </IconBtn>
          <IconBtn label="信息 (i)" active={showInfo} onClick={() => setShowInfo(v => !v)}>
            <Info className="w-4 h-4" />
          </IconBtn>
          <IconBtn label={copied ? '已复制' : '分享'} onClick={handleShare}>
            <Share2 className={`w-4 h-4 ${copied ? 'text-blue-400' : ''}`} />
          </IconBtn>
          <button
            onClick={onClose}
            aria-label="关闭"
            className="w-9 h-9 ml-1 flex items-center justify-center rounded-full bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition-all hover:rotate-90 duration-300"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 左右箭头 */}
      {index > 0 && (
        <NavBtn side="left" onClick={e => { e.stopPropagation(); go(-1) }}>
          <ChevronLeft className="w-5 h-5" />
        </NavBtn>
      )}
      {index < images.length - 1 && (
        <NavBtn side="right" onClick={e => { e.stopPropagation(); go(1) }}>
          <ChevronRight className="w-5 h-5" />
        </NavBtn>
      )}

      {/* 图片区 */}
      <div
        className="flex-1 flex items-center justify-center overflow-hidden select-none"
        onClick={e => e.stopPropagation()}
        onDoubleClick={onDoubleClick}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={endDrag}
        onMouseLeave={endDrag}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        style={{ cursor: scale > MIN_SCALE ? 'grab' : 'default' }}
      >
        {/* 模糊占位 */}
        {!loaded && (
          <div
            className="absolute w-1/3 max-w-xs aspect-[4/3] rounded-xl opacity-60 animate-pulse"
            style={{
              backgroundImage: `url("${blurPlaceholder(img.url)}")`,
              backgroundSize: 'cover',
              filter: 'blur(6px)',
            }}
          />
        )}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={img.id}
          src={img.url}
          alt={img.title}
          draggable={false}
          onLoad={() => setLoaded(true)}
          className={`max-h-[74vh] max-w-[88vw] object-contain rounded-lg shadow-2xl transition-transform duration-200 ease-out ${loaded ? 'opacity-100' : 'opacity-0'}`}
          style={{
            transform: `translate3d(${offset.x}px, ${offset.y}px, 0) scale(${scale})`,
            transitionProperty: dragRef.current ? 'none' : undefined,
            cursor: scale > MIN_SCALE ? 'grabbing' : 'zoom-in',
          }}
        />
      </div>

      {/* 信息面板 */}
      <div
        className="absolute bottom-0 inset-x-0 z-20 transition-transform duration-500 ease-out"
        style={{ transform: showInfo ? 'translateY(0)' : `translateY(calc(100% - 52px))` }}
        onClick={e => e.stopPropagation()}
      >
        <div className="mx-auto max-w-3xl px-5 pb-8 pt-3 bg-gradient-to-t from-black/85 via-black/60 to-transparent">
          <button
            className="mx-auto mb-3 flex items-center gap-1.5 font-mono text-[10px] tracking-[0.3em] uppercase text-white/40 hover:text-white/70 transition-colors"
            onClick={() => setShowInfo(v => !v)}
            aria-label={showInfo ? '收起信息' : '展开信息'}
          >
            <Info className="w-3 h-3" />
            {showInfo ? '收起' : '详情'}
          </button>

          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h3 className="text-white font-black text-xl tracking-tight truncate">
                {img.title || '无标题'}
              </h3>
              {img.description && (
                <p className="mt-1.5 text-sm text-white/50 leading-relaxed line-clamp-3">
                  {img.description}
                </p>
              )}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="text-[9px] font-black uppercase tracking-widest text-blue-400 bg-blue-400/10 border border-blue-400/20 px-2.5 py-1 rounded-full">
                  {img.category}
                </span>
                {img.tags.map(tag => (
                  <span key={tag} className="text-[9px] font-bold tracking-wider text-white/40 bg-white/5 border border-white/10 px-2 py-1 rounded-full">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>

            <button
              onClick={handleLike}
              disabled={liked}
              className={`shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-full font-bold text-sm transition-all duration-300 ${
                liked
                  ? 'bg-red-500/15 text-red-400 border border-red-500/30'
                  : 'bg-white/5 text-white/70 border border-white/10 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/25'
              }`}
            >
              <Heart className={`w-4 h-4 transition-transform ${liked ? 'fill-current scale-110' : ''}`} />
              {likes}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes lbFade { from { opacity: 0 } to { opacity: 1 } }
        .animate-lb-fade { animation: lbFade 0.25s ease forwards }
      `}</style>
    </div>
  )
}

// ── 小组件 ────────────────────────────────────────────────────────────────────
function IconBtn({ children, label, active, onClick }: {
  children: React.ReactNode
  label: string
  active?: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      className={`w-9 h-9 flex items-center justify-center rounded-full border backdrop-blur-md transition-all hover:scale-105 ${
        active
          ? 'bg-blue-500/20 border-blue-400/40 text-blue-300'
          : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white'
      }`}
    >
      {children}
    </button>
  )
}

function NavBtn({ side, children, onClick }: {
  side: 'left' | 'right'
  children: React.ReactNode
  onClick: (e: React.MouseEvent) => void
}) {
  return (
    <button
      onClick={onClick}
      aria-label={side === 'left' ? '上一张' : '下一张'}
      className={`absolute ${side}-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 hidden md:flex items-center justify-center rounded-full bg-white/5 border border-white/10 backdrop-blur-md text-white/50 hover:text-white hover:bg-white/10 hover:scale-110 transition-all`}
    >
      {children}
    </button>
  )
}
