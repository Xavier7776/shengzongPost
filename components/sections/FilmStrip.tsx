'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import type { GALLERY_IMAGES } from '@/lib/data'

type GalleryImage = (typeof GALLERY_IMAGES)[number]

// ── CSS constants ─────────────────────────────────────────────────────────────
const FRAME_W = 260
const FRAME_H = 320
const GAP = 20

// ── Film Reel SVG ─────────────────────────────────────────────────────────────
function FilmReel({ filled, rotating }: { filled: number; rotating: boolean }) {
  const r = 26
  const spokes = 6
  const outerR = 34
  const hubR = 8
  const filmR = hubR + (r - hubR) * filled

  return (
    <svg viewBox="0 0 72 72" width={72} height={72}
      style={{ animation: rotating ? 'reelSpin 2s linear infinite' : 'none', flexShrink: 0 }}
    >
      <circle cx="36" cy="36" r={outerR} fill="#1a1a1a" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
      {Array.from({ length: spokes }).map((_, i) => {
        const angle = (i / spokes) * Math.PI * 2
        return (
          <line key={i}
            x1={36 + Math.cos(angle) * hubR} y1={36 + Math.sin(angle) * hubR}
            x2={36 + Math.cos(angle) * (r - 2)} y2={36 + Math.sin(angle) * (r - 2)}
            stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" strokeLinecap="round"
          />
        )
      })}
      {filmR > hubR + 1 && (
        <circle cx="36" cy="36" r={filmR} fill="none" stroke="rgba(200,169,126,0.25)" strokeWidth={filmR - hubR} />
      )}
      <circle cx="36" cy="36" r={hubR} fill="#111" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
      <circle cx="36" cy="36" r="3" fill="#c8a97e" opacity="0.6" />
    </svg>
  )
}

// ── Film strip progress between reels ─────────────────────────────────────────
function FilmReelProgress({ current, total }: { current: number; total: number }) {
  const progress = total <= 1 ? 1 : current / (total - 1)

  return (
    <div className="flex items-center gap-3 w-full">
      {/* Left reel: starts full, empties */}
      <FilmReel filled={1 - progress} rotating={progress > 0 && progress < 1} />

      {/* Strip track */}
      <div className="flex-1 flex flex-col gap-1.5">
        {/* Top sprocket holes */}
        <div className="flex justify-between px-0.5">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="rounded-[2px] transition-colors duration-500"
              style={{ width: 8, height: 5, background: i / 8 <= progress ? 'rgba(200,169,126,0.5)' : 'rgba(255,255,255,0.08)' }} />
          ))}
        </div>
        {/* Progress track */}
        <div className="relative h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
          <div className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
            style={{ width: `${progress * 100}%`, background: 'linear-gradient(90deg, rgba(200,169,126,0.4), rgba(200,169,126,0.85))' }} />
          <div className="absolute top-1/2 -translate-y-1/2 w-2 h-4 rounded-sm -translate-x-1/2 transition-all duration-500"
            style={{ left: `${progress * 100}%`, background: '#c8a97e', boxShadow: '0 0 6px rgba(200,169,126,0.8)' }} />
        </div>
        {/* Bottom sprocket holes */}
        <div className="flex justify-between px-0.5">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="rounded-[2px] transition-colors duration-500"
              style={{ width: 8, height: 5, background: i / 8 <= progress ? 'rgba(200,169,126,0.5)' : 'rgba(255,255,255,0.08)' }} />
          ))}
        </div>
      </div>

      {/* Right reel: starts empty, fills */}
      <FilmReel filled={progress} rotating={progress > 0 && progress < 1} />
      <style>{`@keyframes reelSpin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

// ── Vinyl groove ring (SVG) ───────────────────────────────────────────────────
function VinylDisc({ spinning }: { spinning: boolean }) {
  return (
    <div
      className="relative flex-shrink-0"
      style={{
        width: 120,
        height: 120,
        animation: spinning ? 'spin 4s linear infinite' : 'none',
      }}
    >
      <svg viewBox="0 0 120 120" width={120} height={120}>
        {/* Outer disc */}
        <circle cx="60" cy="60" r="58" fill="#1a1a1a" />
        {/* Grooves */}
        {[52, 46, 40, 34, 28, 22, 18].map((r) => (
          <circle
            key={r}
            cx="60" cy="60" r={r}
            fill="none"
            stroke="rgba(255,255,255,0.04)"
            strokeWidth="1.5"
          />
        ))}
        {/* Label */}
        <circle cx="60" cy="60" r="14" fill="#111" />
        <circle cx="60" cy="60" r="10" fill="#1c1c1c" />
        {/* Label text arc */}
        <circle cx="60" cy="60" r="2.5" fill="#c8a97e" />
        {/* Rim highlight */}
        <circle
          cx="60" cy="60" r="57"
          fill="none"
          stroke="rgba(255,255,255,0.07)"
          strokeWidth="1"
        />
      </svg>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

// ── Individual frame ──────────────────────────────────────────────────────────
function VinylFrame({
  img,
  index,
  isActive,
  onClick,
}: {
  img: GalleryImage
  index: number
  isActive: boolean
  onClick: () => void
}) {
  return (
    <div
      className="relative flex-shrink-0 cursor-pointer group"
      style={{ width: FRAME_W }}
      onClick={onClick}
    >
      {/* Track number */}
      <div className="flex items-center gap-2 mb-2 px-1">
        <span
          className="font-mono text-[9px] tracking-[0.3em]"
          style={{ color: isActive ? '#c8a97e' : 'rgba(255,255,255,0.18)' }}
        >
          {String(index + 1).padStart(2, '0')}
        </span>
        <div
          className="flex-1 h-px transition-colors duration-500"
          style={{ background: isActive ? 'rgba(200,169,126,0.3)' : 'rgba(255,255,255,0.06)' }}
        />
      </div>

      {/* Photo sleeve */}
      <div
        className="relative overflow-hidden transition-all duration-600"
        style={{
          height: FRAME_H,
          borderRadius: 3,
          border: isActive
            ? '1px solid rgba(200,169,126,0.5)'
            : '1px solid rgba(255,255,255,0.07)',
          transform: isActive ? 'scale(1.05) translateY(-4px)' : 'scale(0.94)',
          filter: isActive ? 'none' : 'brightness(0.42) saturate(0.5)',
          boxShadow: isActive
            ? '0 2px 0 rgba(200,169,126,0.15), 0 24px 80px rgba(0,0,0,0.9), inset 0 1px 0 rgba(255,255,255,0.06)'
            : '0 4px 16px rgba(0,0,0,0.6)',
          transition: 'all 0.5s cubic-bezier(0.34,1.56,0.64,1)',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={img.url}
          alt={img.title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
        />

        {/* Vinyl sheen — diagonal gloss */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, transparent 50%, rgba(0,0,0,0.2) 100%)',
          }}
        />

        {/* Heavy vignette */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.55) 100%)',
          }}
        />

        {/* Grain */}
        <div
          className="absolute inset-0 pointer-events-none opacity-20 mix-blend-overlay"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          }}
        />

        {/* Active: gold bottom bar */}
        {isActive && (
          <div
            className="absolute bottom-0 left-0 right-0 h-[2px]"
            style={{ background: 'linear-gradient(90deg, transparent, #c8a97e, transparent)' }}
          />
        )}
      </div>

      {/* Caption */}
      <div className="mt-2.5 px-1 flex items-center justify-between">
        <span
          className="text-[9px] font-mono tracking-[0.25em] uppercase transition-colors duration-400"
          style={{ color: isActive ? 'rgba(200,169,126,0.7)' : 'rgba(255,255,255,0.15)' }}
        >
          {img.category}
        </span>
        {isActive && (
          <span
            className="text-[9px] font-mono"
            style={{ color: 'rgba(200,169,126,0.4)' }}
          >
            ▶
          </span>
        )}
      </div>
    </div>
  )
}

// ── Lightbox ──────────────────────────────────────────────────────────────────
function Lightbox({
  images,
  currentIndex,
  onClose,
  onPrev,
  onNext,
}: {
  images: GalleryImage[]
  currentIndex: number
  onClose: () => void
  onPrev: () => void
  onNext: () => void
}) {
  const img = images[currentIndex]

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') onPrev()
      if (e.key === 'ArrowRight') onNext()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose, onPrev, onNext])

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center"
      style={{ background: 'rgba(4,4,4,0.97)', backdropFilter: 'blur(28px)' }}
      onClick={onClose}
    >
      {/* Subtle radial glow behind image */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(200,169,126,0.04) 0%, transparent 70%)',
        }}
      />

      {/* Close */}
      <button
        className="absolute top-6 right-6 z-10 w-9 h-9 flex items-center justify-center rounded-full transition-all hover:scale-110"
        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)' }}
        onClick={onClose}
      >
        <X className="w-3.5 h-3.5" />
      </button>

      {/* Counter */}
      <div
        className="absolute top-7 left-1/2 -translate-x-1/2 font-mono text-[10px] tracking-[0.4em]"
        style={{ color: 'rgba(200,169,126,0.4)' }}
      >
        {String(currentIndex + 1).padStart(2, '0')} / {String(images.length).padStart(2, '0')}
      </div>

      {/* Prev */}
      <button
        className="absolute left-6 w-11 h-11 flex items-center justify-center rounded-full transition-all hover:scale-110 disabled:opacity-20"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.4)' }}
        onClick={e => { e.stopPropagation(); onPrev() }}
        disabled={currentIndex === 0}
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      {/* Next */}
      <button
        className="absolute right-6 w-11 h-11 flex items-center justify-center rounded-full transition-all hover:scale-110 disabled:opacity-20"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.4)' }}
        onClick={e => { e.stopPropagation(); onNext() }}
        disabled={currentIndex === images.length - 1}
      >
        <ChevronRight className="w-4 h-4" />
      </button>

      {/* Image */}
      <div
        className="relative flex flex-col items-center"
        onClick={e => e.stopPropagation()}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={img.id}
          src={img.url}
          alt={img.title}
          className="max-h-[76vh] max-w-[82vw] object-contain"
          style={{
            borderRadius: 2,
            boxShadow: '0 0 0 1px rgba(200,169,126,0.12), 0 50px 140px rgba(0,0,0,0.95)',
            animation: 'lbIn 0.3s cubic-bezier(0.34,1.56,0.64,1) forwards',
          }}
        />
        <div className="mt-5 flex items-center gap-3">
          <span
            className="font-mono text-[9px] tracking-[0.4em] uppercase"
            style={{ color: 'rgba(200,169,126,0.55)' }}
          >
            {img.category}
          </span>
          <span style={{ color: 'rgba(255,255,255,0.1)' }}>—</span>
          <span
            className="text-sm font-semibold tracking-tight"
            style={{ color: 'rgba(255,255,255,0.5)' }}
          >
            {img.title}
          </span>
        </div>
      </div>

      <style>{`
        @keyframes lbIn {
          from { opacity: 0; transform: scale(0.96) translateY(8px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function FilmStrip({ images }: { images: GalleryImage[] }) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const stripRef = useRef<HTMLDivElement>(null)
  const isDragging = useRef(false)
  const dragStart = useRef(0)
  const scrollStart = useRef(0)
  const hasDragged = useRef(false)

  const scrollToFrame = useCallback((index: number) => {
    const strip = stripRef.current
    if (!strip) return
    const frameCenter = index * (FRAME_W + GAP) + FRAME_W / 2
    strip.scrollTo({ left: frameCenter - strip.clientWidth / 2, behavior: 'smooth' })
  }, [])

  const goTo = useCallback((index: number) => {
    const clamped = Math.max(0, Math.min(images.length - 1, index))
    setActiveIndex(clamped)
    scrollToFrame(clamped)
  }, [images.length, scrollToFrame])

  useEffect(() => {
    if (lightboxOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') goTo(activeIndex - 1)
      if (e.key === 'ArrowRight') goTo(activeIndex + 1)
      if (e.key === 'Enter') setLightboxOpen(true)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [activeIndex, lightboxOpen, goTo])

  const onMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true
    hasDragged.current = false
    dragStart.current = e.clientX
    scrollStart.current = stripRef.current?.scrollLeft ?? 0
  }
  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current || !stripRef.current) return
    const delta = dragStart.current - e.clientX
    if (Math.abs(delta) > 4) hasDragged.current = true
    stripRef.current.scrollLeft = scrollStart.current + delta
  }
  const onMouseUp = () => { isDragging.current = false }

  return (
    <div className="select-none">
      {/* ── Strip wrapper ── */}
      <div
        className="relative overflow-hidden"
        style={{
          background: 'linear-gradient(180deg, #080808 0%, #0e0e0e 40%, #080808 100%)',
          borderRadius: 6,
          border: '1px solid rgba(255,255,255,0.05)',
          boxShadow: '0 40px 100px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.04)',
        }}
      >
        {/* Top groove line */}
        <div
          className="w-full h-px"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(200,169,126,0.15), transparent)' }}
        />

        {/* Scrollable frames */}
        <div
          ref={stripRef}
          className="flex overflow-x-auto cursor-grab active:cursor-grabbing"
          style={{
            gap: GAP,
            padding: '36px 60px',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
        >
          <style>{`.vinyl-scroll::-webkit-scrollbar{display:none}`}</style>

          {images.map((img, i) => (
            <VinylFrame
              key={img.id}
              img={img}
              index={i}
              isActive={i === activeIndex}
              onClick={() => {
                if (hasDragged.current) return
                if (i === activeIndex) setLightboxOpen(true)
                else goTo(i)
              }}
            />
          ))}
        </div>

        {/* Bottom groove line */}
        <div
          className="w-full h-px"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(200,169,126,0.15), transparent)' }}
        />

        {/* Side vignettes */}
        <div className="absolute inset-y-0 left-0 w-24 pointer-events-none" style={{ background: 'linear-gradient(90deg, #080808, transparent)', zIndex: 10 }} />
        <div className="absolute inset-y-0 right-0 w-24 pointer-events-none" style={{ background: 'linear-gradient(-90deg, #080808, transparent)', zIndex: 10 }} />
      </div>

      {/* ── Bottom bar ── */}
      <div className="mt-6 px-1 space-y-5">
        {/* Reel progress */}
        <FilmReelProgress current={activeIndex} total={images.length} />

        {/* Meta + nav row */}
        <div className="flex items-center justify-between">
          <div>
            <p className="font-mono text-[9px] tracking-[0.35em] uppercase mb-1"
              style={{ color: 'rgba(200,169,126,0.55)' }}>
              {images[activeIndex].category}
            </p>
            <h3 className="text-xl font-black tracking-tight" style={{ color: '#e8e8e8' }}>
              {images[activeIndex].title}
            </h3>
            <p className="font-mono text-[10px] mt-1 tracking-widest"
              style={{ color: 'rgba(255,255,255,0.18)' }}>
              {String(activeIndex + 1).padStart(2, '0')} / {String(images.length).padStart(2, '0')}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              className="w-10 h-10 flex items-center justify-center rounded-full transition-all hover:scale-105 disabled:opacity-20"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)' }}
              onClick={() => goTo(activeIndex - 1)}
              disabled={activeIndex === 0}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              className="w-10 h-10 flex items-center justify-center rounded-full transition-all hover:scale-105 disabled:opacity-20"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)' }}
              onClick={() => goTo(activeIndex + 1)}
              disabled={activeIndex === images.length - 1}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Track dots ── */}
      <div className="flex items-center justify-center gap-2 mt-5">
        {images.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            className="transition-all duration-300"
            style={{
              width: i === activeIndex ? 20 : 5,
              height: 5,
              borderRadius: 3,
              background: i === activeIndex ? '#c8a97e' : 'rgba(255,255,255,0.12)',
            }}
          />
        ))}
      </div>

      {/* ── Lightbox ── */}
      {lightboxOpen && (
        <Lightbox
          images={images}
          currentIndex={activeIndex}
          onClose={() => setLightboxOpen(false)}
          onPrev={() => goTo(activeIndex - 1)}
          onNext={() => goTo(activeIndex + 1)}
        />
      )}
    </div>
  )
}
