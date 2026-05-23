'use client'

import { useEffect, useState, useRef, useCallback } from 'react'

interface TocItem {
  id: string
  text: string
  level: number // 2 or 3
  index: number
}

interface TableOfContentsProps {
  contentSelector: string
}

export default function TableOfContents({ contentSelector }: TableOfContentsProps) {
  const [items, setItems] = useState<TocItem[]>([])
  const [activeId, setActiveId] = useState<string>('')
  const [visible, setVisible] = useState(false)
  const [isDesktop, setIsDesktop] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrollProgress, setScrollProgress] = useState(0)
  const [showToc, setShowToc] = useState(true)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const activeRef = useRef<HTMLButtonElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  // Track viewport width
  useEffect(() => {
    const mql = window.matchMedia('(min-width: 1280px)')
    setIsDesktop(mql.matches)
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches)
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [])

  // Extract headings from content
  useEffect(() => {
    const container = document.querySelector(contentSelector)
    if (!container) return

    const headings = container.querySelectorAll('h2, h3')
    if (headings.length === 0) return

    const parsed: TocItem[] = []
    let h2Count = 0
    headings.forEach((el, i) => {
      const level = el.tagName === 'H2' ? 2 : 3
      const text = el.textContent?.trim() || ''
      if (!text) return

      if (!el.id) {
        el.id = `toc-heading-${i}`
      }

      if (level === 2) h2Count++
      parsed.push({ id: el.id, text, level, index: level === 2 ? h2Count : 0 })
    })

    if (parsed.length > 0) {
      setItems(parsed)
      setVisible(true)
    }
  }, [contentSelector])

  // IntersectionObserver for scroll tracking
  useEffect(() => {
    if (items.length === 0) return

    const headings = items.map(item => document.getElementById(item.id)).filter(Boolean) as HTMLElement[]
    if (headings.length === 0) return

    observerRef.current = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id)
            break
          }
        }
      },
      { rootMargin: '-80px 0px -70% 0px', threshold: 0 }
    )

    headings.forEach(el => observerRef.current?.observe(el))

    return () => observerRef.current?.disconnect()
  }, [items])

  // Auto-scroll active item into view within the TOC panel
  useEffect(() => {
    if (activeRef.current && listRef.current) {
      const list = listRef.current
      const btn = activeRef.current
      const listRect = list.getBoundingClientRect()
      const btnRect = btn.getBoundingClientRect()

      if (btnRect.top < listRect.top || btnRect.bottom > listRect.bottom) {
        btn.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      }
    }
  }, [activeId])

  // Track scroll progress
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      setScrollProgress(docHeight <= 0 ? 0 : scrollTop / docHeight)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollTo = useCallback((id: string) => {
    const el = document.getElementById(id)
    if (!el) return
    const y = el.getBoundingClientRect().top + window.scrollY - 100
    window.scrollTo({ top: y, behavior: 'smooth' })
    setMobileOpen(false)
  }, [])

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  if (!visible || items.length === 0) return null

  const tocContent = (
    <>
      {/* Header with progress */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        marginBottom: 16,
        paddingBottom: 12,
        borderBottom: '1px solid #f3f4f6',
      }}>
        <span style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          color: '#9ca3af',
        }}>
          目录
        </span>
        <span style={{
          flex: 1,
          height: 3,
          background: '#f3f4f6',
          borderRadius: 2,
          overflow: 'hidden',
        }}>
          <span style={{
            display: 'block',
            height: '100%',
            width: `${scrollProgress * 100}%`,
            background: 'linear-gradient(to right, #3b82f6, #6366f1)',
            borderRadius: 2,
            transition: 'width 100ms ease-out',
          }} />
        </span>
        <span style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: 10,
          color: '#9ca3af',
          minWidth: 30,
          textAlign: 'right',
        }}>
          {Math.round(scrollProgress * 100)}%
        </span>
      </div>

      {/* TOC list */}
      <ul ref={listRef} style={{ listStyle: 'none', margin: 0, padding: 0, overflowY: 'auto', maxHeight: 'calc(100vh - 260px)' }}>
        {items.map(item => {
          const isActive = activeId === item.id
          return (
            <li key={item.id} style={{
              marginLeft: item.level === 3 ? 16 : 0,
              position: 'relative',
            }}>
              {/* Active indicator bar */}
              {isActive && (
                <span style={{
                  position: 'absolute',
                  left: 0,
                  top: 4,
                  bottom: 4,
                  width: 2,
                  background: 'linear-gradient(to bottom, #3b82f6, #6366f1)',
                  borderRadius: 1,
                  animation: 'toc-bar-in 0.2s ease',
                }} />
              )}

              <button
                ref={isActive ? activeRef : undefined}
                onClick={() => scrollTo(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  width: '100%',
                  textAlign: 'left',
                  padding: '5px 0 5px 14px',
                  fontSize: item.level === 2 ? 13 : 12,
                  lineHeight: 1.6,
                  fontFamily: "'DM Sans', sans-serif",
                  color: isActive ? '#111827' : '#9ca3af',
                  background: isActive ? 'rgba(59,130,246,0.04)' : 'none',
                  borderRadius: '0 6px 6px 0',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  fontWeight: isActive ? 600 : item.level === 2 ? 500 : 400,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.color = '#374151'
                    e.currentTarget.style.background = 'rgba(0,0,0,0.02)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.color = '#9ca3af'
                    e.currentTarget.style.background = 'none'
                  }
                }}
              >
                {item.level === 2 && (
                  <span style={{
                    fontSize: 10,
                    fontFamily: "'DM Mono', monospace",
                    color: isActive ? '#3b82f6' : '#d1d5db',
                    fontWeight: 700,
                    minWidth: 16,
                    transition: 'color 0.2s ease',
                  }}>
                    {String(item.index).padStart(2, '0')}
                  </span>
                )}
                <span style={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}>
                  {item.text}
                </span>
              </button>
            </li>
          )
        })}
      </ul>

      {/* Back to top */}
      <button
        onClick={scrollToTop}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 4,
          width: '100%',
          marginTop: 12,
          paddingTop: 10,
          borderTop: '1px solid #f3f4f6',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 11,
          color: '#9ca3af',
          transition: 'color 0.2s ease',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.color = '#3b82f6' }}
        onMouseLeave={(e) => { e.currentTarget.style.color = '#9ca3af' }}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <path d="M12 19V5M5 12l7-7 7 7" />
        </svg>
        回到顶部
      </button>
    </>
  )

  // Desktop: fixed sidebar
  if (isDesktop) {
    return (
      <nav style={{
        position: 'fixed',
        top: 100,
        right: 'max(24px, calc((100vw - 1100px) / 2 - 240px))',
        width: 210,
        maxHeight: 'calc(100vh - 140px)',
        padding: '16px 12px',
        zIndex: 50,
        opacity: showToc ? 1 : 0,
        transform: showToc ? 'translateX(0)' : 'translateX(12px)',
        transition: 'opacity 0.4s ease, transform 0.4s ease',
        pointerEvents: showToc ? 'auto' : 'none',
      }}>
        <style>{`
          @keyframes toc-bar-in {
            from { transform: scaleY(0); }
            to   { transform: scaleY(1); }
          }
        `}</style>
        {tocContent}
      </nav>
    )
  }

  // Mobile: floating button + popup
  return (
    <>
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        style={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          zIndex: 100,
          width: 44,
          height: 44,
          borderRadius: '50%',
          background: '#fff',
          border: '1px solid #e5e7eb',
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s ease',
          opacity: showToc ? 1 : 0,
          transform: showToc ? 'scale(1)' : 'scale(0.8)',
          pointerEvents: showToc ? 'auto' : 'none',
        }}
        aria-label="目录"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2" strokeLinecap="round">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="15" y2="12" />
          <line x1="3" y1="18" x2="18" y2="18" />
        </svg>
      </button>

      {mobileOpen && (
        <>
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.3)',
              zIndex: 200,
              backdropFilter: 'blur(4px)',
            }}
            onClick={() => setMobileOpen(false)}
          />
          <nav style={{
            position: 'fixed',
            bottom: 72,
            right: 20,
            zIndex: 201,
            background: '#fff',
            borderRadius: 16,
            border: '1px solid #e5e7eb',
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            padding: '20px 16px',
            maxHeight: '60vh',
            overflowY: 'auto',
            width: 280,
            animation: 'slideUp 0.3s cubic-bezier(0.16,1,0.3,1)',
          }}>
            {tocContent}
          </nav>
        </>
      )}
    </>
  )
}
