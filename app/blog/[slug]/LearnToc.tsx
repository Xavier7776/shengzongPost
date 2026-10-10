'use client'

import { useEffect, useMemo, useState } from 'react'
import { List, X } from 'lucide-react'
import { headingId } from '@/shared/markdown/heading-id'

type TocItem = { id: string; text: string; level: 2 | 3; parentId: string | null }

/** Study editions use an in-grid sticky ToC on desktop and a floating chapter drawer on mobile.
 * Read headings from the actual article DOM so legacy fallback content stays compatible.
 */
export default function LearnToc() {
  const [items, setItems] = useState<TocItem[]>([])
  const [activeId, setActiveId] = useState('')
  const [drawerOpen, setDrawerOpen] = useState(false)

  useEffect(() => {
    const root = document.getElementById('blog-reader-root') ?? document.body
    let restoredHash = false

    const scan = () => {
      const reader = root.querySelector('.reader-content')
      if (!reader) return
      const result: TocItem[] = []
      const used = new Set(Array.from(reader.querySelectorAll('[id]'), element => element.id))
      let parentId: string | null = null
      reader.querySelectorAll('h2, h3').forEach((element, index) => {
        const text = element.textContent?.trim()
        if (!text) return
        if (!element.id) element.id = headingId(text, used)
        const level = element.tagName === 'H2' ? 2 : 3
        if (level === 2) parentId = element.id
        result.push({ id: element.id, text, level, parentId: level === 2 ? null : parentId })
      })
      setItems(previous => {
        if (previous.length === result.length && previous.every((item, i) =>
          item.id === result[i].id && item.text === result[i].text && item.level === result[i].level
        )) return previous
        return result
      })
      if (!restoredHash && location.hash) {
        try {
          const target = document.getElementById(decodeURIComponent(location.hash.slice(1)))
          if (target && reader.contains(target)) { target.scrollIntoView(); restoredHash = true }
        } catch { /* Invalid URL fragments leave the article readable. */ }
      }
    }

    scan()
    // The async PostContent server component can arrive after client hydration.
    const observer = new MutationObserver(scan)
    observer.observe(root, { childList: true, subtree: true })
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!items.length) return
    let frame = 0
    const update = () => {
      frame = 0
      let current = items[0].id
      for (const item of items) {
        const heading = document.getElementById(item.id)
        if (heading && heading.getBoundingClientRect().top <= 160) current = item.id
      }
      setActiveId(previous => previous === current ? previous : current)
    }
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (frame) window.cancelAnimationFrame(frame)
    }
  }, [items])

  useEffect(() => {
    if (!drawerOpen) return
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setDrawerOpen(false)
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [drawerOpen])

  const sections = useMemo(() => items.filter(item => item.level === 2), [items])
  const activeItem = items.find(item => item.id === activeId)
  const activeSectionId = activeItem?.level === 3
    ? activeItem.parentId
    : (activeItem?.id ?? sections[0]?.id ?? null)
  const sectionIndex = Math.max(0, sections.findIndex(item => item.id === activeSectionId)) + 1
  // Show all main sections but only the subsections of the active chapter.
  const visibleItems = items.filter(item => item.level === 2 || item.parentId === activeSectionId)

  const navigate = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    setActiveId(id)
    setDrawerOpen(false)
  }

  const renderLinks = () => (
    <ol className="learn-toc-list" aria-label="文章章节">
      {visibleItems.map(item => (
        <li key={item.id} className={item.level === 3 ? 'learn-toc-subitem' : ''}>
          <button
            type="button"
            aria-current={activeId === item.id ? 'location' : undefined}
            onClick={() => navigate(item.id)}
            title={item.text}
          >
            {item.text}
          </button>
        </li>
      ))}
    </ol>
  )

  if (!sections.length) return null

  return (
    <>
      <aside className="learn-toc-rail hidden xl:block" aria-label="专刊章节导航">
        <div className="learn-toc-panel">
          <div className="learn-toc-caption">学习目录</div>
          <p className="learn-toc-progress">第 {sectionIndex} / {sections.length} 节</p>
          {renderLinks()}
        </div>
      </aside>
      <div className="xl:hidden">
        <button
          className="learn-toc-floating"
          type="button"
          onClick={() => setDrawerOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={drawerOpen}
          aria-controls="learn-mobile-chapters"
        >
          <List className="h-4 w-4" /> 章节 · {sectionIndex}/{sections.length}
        </button>
        {drawerOpen && (
          <div className="learn-toc-overlay">
            <button
              type="button"
              className="learn-toc-scrim"
              onClick={() => setDrawerOpen(false)}
              aria-label="关闭章节目录"
            />
            <nav
              id="learn-mobile-chapters"
              className="learn-toc-drawer"
              aria-label="专刊章节"
              role="dialog"
              aria-modal="true"
            >
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <div className="text-base font-bold text-gray-900">学习目录</div>
                  <p className="mt-1 text-xs text-gray-500">第 {sectionIndex} / {sections.length} 节</p>
                </div>
                <button type="button" aria-label="关闭目录" onClick={() => setDrawerOpen(false)} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100">
                  <X className="h-5 w-5" />
                </button>
              </div>
              {renderLinks()}
            </nav>
          </div>
        )}
      </div>
    </>
  )
}
