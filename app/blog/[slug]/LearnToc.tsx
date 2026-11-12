'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown, List, X } from 'lucide-react'
import { headingId } from '@/shared/markdown/heading-id'
import { chapterLabel, groupReaderHeadings, type ReaderHeading } from '@/lib/reader-toc'

export default function LearnToc({ study = true }: { study?: boolean }) {
  const [items, setItems] = useState<ReaderHeading[]>([])
  const [activeId, setActiveId] = useState('')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [progress, setProgress] = useState({ passed: 0, total: 0, label: '未开始学习' })
  const drawer = useRef<HTMLElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const root = document.getElementById('blog-reader-root') ?? document.body
    let restoredHash = false
    const scan = () => {
      const reader = root.querySelector('.reader-content')
      if (!reader) return
      const result: ReaderHeading[] = []
      const used = new Set(Array.from(reader.querySelectorAll('[id]'), element => element.id))
      let parentId: string | null = null
      reader.querySelectorAll('h2, h3').forEach(element => {
        const text = element.textContent?.trim()
        if (!text) return
        if (!element.id) element.id = headingId(text, used)
        const level = element.tagName === 'H2' ? 2 : 3
        if (level === 2) parentId = element.id
        result.push({ id: element.id, text, level, parentId: level === 2 ? null : parentId })
      })
      setItems(previous => JSON.stringify(previous) === JSON.stringify(result) ? previous : result)
      const record = root.querySelector<HTMLElement>('[data-reader-progress]')
      if (record) {
        const next = { passed: Number(record.dataset.readerPassed) || 0, total: Number(record.dataset.readerTotal) || 0, label: record.dataset.readerState || '未开始学习' }
        setProgress(previous => JSON.stringify(previous) === JSON.stringify(next) ? previous : next)
      }
      if (!restoredHash && location.hash) {
        try {
          const target = document.getElementById(decodeURIComponent(location.hash.slice(1)))
          if (target && reader.contains(target)) { target.scrollIntoView(); restoredHash = true }
        } catch { /* Invalid fragments leave the article readable. */ }
      }
    }
    scan()
    const observer = new MutationObserver(scan)
    observer.observe(root, { childList: true, subtree: true, attributes: true, attributeFilter: ['data-reader-passed', 'data-reader-total', 'data-reader-state'] })
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
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update) }
    if (window.scrollY === 0) setActiveId(items[0].id)
    else onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => { window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll); cancelAnimationFrame(frame) }
  }, [items])

  useEffect(() => {
    if (!drawerOpen) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    drawer.current?.querySelector<HTMLButtonElement>('button')?.focus()
    const keydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setDrawerOpen(false)
      if (event.key !== 'Tab') return
      const buttons = drawer.current?.querySelectorAll<HTMLButtonElement>('button')
      if (!buttons?.length) return
      const first = buttons[0], last = buttons[buttons.length - 1]
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }
    const resize = () => { if (window.innerWidth >= 1100) setDrawerOpen(false) }
    window.addEventListener('keydown', keydown)
    window.addEventListener('resize', resize)
    return () => { document.body.style.overflow = previousOverflow; window.removeEventListener('keydown', keydown); window.removeEventListener('resize', resize); trigger.current?.focus() }
  }, [drawerOpen])

  const sections = items.filter(item => item.level === 2)
  const groups = useMemo(() => groupReaderHeadings(items, study), [items, study])
  const active = items.find(item => item.id === activeId)
  const activeSectionId = active?.parentId || active?.id || sections[0]?.id
  const sectionIndex = Math.max(0, sections.findIndex(item => item.id === activeSectionId)) + 1
  const activeGroup = groups.find(group => group.id === activeSectionId || group.items.some(item => item.id === activeId))
  const navigate = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' })
    setActiveId(id)
    setExpanded({})
    setDrawerOpen(false)
    history.replaceState(null, '', '#' + encodeURIComponent(id))
  }
  const renderLinks = () => <div className="reader-toc-groups">
    {groups.map((group, index) => {
      const isExpanded = expanded[group.id] ?? (group.id === activeGroup?.id)
      const mainItems = group.items.filter(item => item.level === 2 || item.parentId === activeSectionId)
      const visible = isExpanded ? mainItems : []
      return <section className={'reader-toc-group' + (group.id === activeGroup?.id ? ' is-active' : '')} key={group.id}>
        <button type="button" className="reader-toc-group-title" aria-expanded={study ? isExpanded : undefined} aria-current={!study && activeSectionId === group.id ? 'location' : undefined} onClick={() => {
          if (!study) navigate(group.id)
          else setExpanded(Object.fromEntries(groups.map(entry => [entry.id, entry.id === group.id && !isExpanded])))
        }}><span className="reader-toc-index" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span><span>{group.title}</span><ChevronDown size={14} aria-hidden="true" /></button>
        {visible.length > 0 && <ol aria-label={group.title + '章节'}>
          {visible.map(item => <li key={item.id} className={item.level === 3 ? 'reader-toc-subitem' : ''}>
            <button type="button" title={item.text} aria-label={item.text} aria-current={activeId === item.id ? 'location' : undefined} onClick={() => navigate(item.id)}>{chapterLabel(item.text)}</button>
          </li>)}
        </ol>}
      </section>
    })}
  </div>
  const renderProgress = () => <div className="reader-toc-footer">
    <div><span>{study && progress.total ? '自测进度' : '阅读章节'}</span><strong>{study && progress.total ? `${progress.passed}/${progress.total}` : `${sectionIndex}/${sections.length}`}</strong></div>
    <progress aria-label={study && progress.total ? '自测进度' : '阅读章节'} value={study && progress.total ? progress.passed : sectionIndex} max={study && progress.total ? progress.total : sections.length} />
    <small>{study && progress.total ? progress.label : '按章节继续阅读'}</small>
  </div>
  if (!sections.length) return null
  return <>
    <aside className="reader-toc-rail" aria-label={study ? '专刊章节导航' : '文章章节导航'}>
      <div className="reader-toc-panel"><div className="reader-toc-caption">阅读目录<span>{sections.length} 个章节</span></div>{renderLinks()}{renderProgress()}</div>
    </aside>
    <div className="reader-toc-mobile">
      <button ref={trigger} type="button" className="reader-toc-trigger" aria-haspopup="dialog" aria-expanded={drawerOpen} aria-controls="reader-mobile-chapters" onClick={() => setDrawerOpen(true)}><List size={17} />章节 <span>{sectionIndex}/{sections.length}</span></button>
      {drawerOpen && createPortal(<div className="reader-toc-overlay">
        <button className="reader-toc-scrim" aria-label="关闭章节目录" onClick={() => setDrawerOpen(false)} />
        <nav ref={drawer} id="reader-mobile-chapters" className="reader-toc-drawer" role="dialog" aria-modal="true" aria-label={study ? '专刊章节' : '文章章节'}>
          <div className="reader-toc-drawer-heading"><strong>本篇目录</strong><button type="button" aria-label="关闭目录" onClick={() => setDrawerOpen(false)}><X size={20} /></button></div>
          {renderLinks()}{renderProgress()}
        </nav>
      </div>, document.body)}
    </div>
  </>
}
