'use client'
// 博客阅读工具栏：字号调节 + 阅读模式切换
// - 字号范围 14~24px，步进 2px，默认 16px
// - 阅读模式：默认 / 护眼 / 深色
// - 使用 localStorage 持久化用户选择
// - 仅影响文章正文区域（.reader-content）
import { useEffect, useState, useCallback, useRef } from 'react'
import { Minus, Plus, Sun, BookOpen, Moon, ChevronDown } from 'lucide-react'

const FONT_KEY = 'blog-reader-font-size'
const MODE_KEY = 'blog-reader-mode'

const MIN_FONT = 14
const MAX_FONT = 24
const DEFAULT_FONT = 16
const LEARN_DEFAULT_FONT = 18
const STEP = 2

type Mode = 'default' | 'sepia' | 'dark'

const MODES: { value: Mode; label: string; icon: typeof Sun }[] = [
  { value: 'default', label: '默认', icon: Sun },
  { value: 'sepia', label: '护眼', icon: BookOpen },
  { value: 'dark', label: '深色', icon: Moon },
]

export default function BlogReaderToolbar({ variant = 'standard' }: { variant?: 'standard' | 'learn' }) {
  const storageKey = variant === 'learn' ? 'learn-reader-font-size' : FONT_KEY
  const initialFont = variant === 'learn' ? LEARN_DEFAULT_FONT : DEFAULT_FONT
  const [fontSize, setFontSize] = useState(initialFont)
  const [mode, setMode] = useState<Mode>('default')
  const [mounted, setMounted] = useState(false)
  const toolbar = useRef<HTMLDivElement>(null)

  // 初始化：从 localStorage 读取用户偏好
  useEffect(() => {
    try {
      const savedFont = localStorage.getItem(storageKey)
      const n = savedFont ? Number(savedFont) : initialFont
      setFontSize(Number.isFinite(n) && n >= MIN_FONT && n <= MAX_FONT ? n : initialFont)
      const savedMode = localStorage.getItem(MODE_KEY) as Mode | null
      if (savedMode && ['default', 'sepia', 'dark'].includes(savedMode)) {
        setMode(savedMode)
      }
    } catch { /* Keep default reader controls when storage is blocked. */ }
    setMounted(true)
  }, [storageKey, initialFont])

  // The article shell has hydrated; its streamed reader content may still be pending.
  useEffect(() => {
    if (!mounted) return
    const article = toolbar.current?.closest('article')
    if (!article) return
    article.style.setProperty('--reader-font-size', fontSize + 'px')
    article.classList.remove('reader-mode-default', 'reader-mode-sepia', 'reader-mode-dark')
    article.classList.add('reader-mode-' + mode)
  }, [fontSize, mode, mounted])

  const decreaseFont = useCallback(() => {
    setFontSize(prev => {
      const next = Math.max(MIN_FONT, prev - STEP)
      try { localStorage.setItem(storageKey, String(next)) } catch { /* The current page remains adjustable. */ }
      return next
    })
  }, [storageKey])

  const increaseFont = useCallback(() => {
    setFontSize(prev => {
      const next = Math.min(MAX_FONT, prev + STEP)
      try { localStorage.setItem(storageKey, String(next)) } catch { /* The current page remains adjustable. */ }
      return next
    })
  }, [storageKey])

  const changeMode = useCallback((m: Mode) => {
    setMode(m)
    try { localStorage.setItem(MODE_KEY, m) } catch { /* The current page remains adjustable. */ }
  }, [])

  useEffect(() => {
    const close = (event: PointerEvent | KeyboardEvent) => {
      if (event instanceof KeyboardEvent && event.key !== 'Escape') return
      if (event.type === 'pointerdown' && toolbar.current?.contains(event.target as Node)) return
      const details = toolbar.current?.querySelector('details')
      if (details?.open) {
        details.open = false
        if (event instanceof KeyboardEvent) details.querySelector('summary')?.focus()
      }
    }
    document.addEventListener('pointerdown', close)
    document.addEventListener('keydown', close)
    return () => { document.removeEventListener('pointerdown', close); document.removeEventListener('keydown', close) }
  }, [])

  return <div ref={toolbar} className="reader-toolbar">
    <details className="reader-settings">
      <summary aria-label="阅读设置"><span aria-hidden="true">Aa</span><ChevronDown size={13} aria-hidden="true" /></summary>
      <div className="reader-settings-panel" role="group" aria-label="阅读偏好">
        <div className="reader-settings-title">阅读设置</div>
        <div className="reader-font-controls"><span>字号</span><div>
          <button type="button" onClick={decreaseFont} disabled={fontSize <= MIN_FONT} aria-label="缩小字号"><Minus size={15} /></button>
          <output>{fontSize}px</output>
          <button type="button" onClick={increaseFont} disabled={fontSize >= MAX_FONT} aria-label="放大字号"><Plus size={15} /></button>
        </div></div>
        <p className="reader-settings-label">阅读模式</p>
        <div className="reader-mode-controls">{MODES.map(({ value, label, icon: Icon }) => <button type="button" key={value} onClick={() => changeMode(value)} aria-label={`${label}模式`} aria-pressed={mode === value}><Icon size={16} /><span>{label}</span></button>)}</div>
      </div>
    </details>
  </div>
}
