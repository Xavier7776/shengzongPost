'use client'
// 博客阅读工具栏：字号调节 + 阅读模式切换
// - 字号范围 14~24px，步进 2px，默认 16px
// - 阅读模式：默认 / 护眼 / 深色
// - 使用 localStorage 持久化用户选择
// - 仅影响文章正文区域（.reader-content）
import { useEffect, useState, useCallback, useRef } from 'react'
import { Minus, Plus, Sun, BookOpen, Moon, ChevronDown } from 'lucide-react'
import { useHydrated, useStoredString, notifyStorageChange } from '@/shared/browser-state'

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

export default function BlogReaderToolbar(props: { variant?: 'standard' | 'learn' }) {
  return <ReaderPreferences key={props.variant ?? 'standard'} {...props} />
}

function ReaderPreferences({ variant = 'standard' }: { variant?: 'standard' | 'learn' }) {
  const storageKey = variant === 'learn' ? 'learn-reader-font-size' : FONT_KEY
  const initialFont = variant === 'learn' ? LEARN_DEFAULT_FONT : DEFAULT_FONT
  const [fontOverride, setFontSize] = useState<number | null>(null)
  const [modeOverride, setMode] = useState<Mode | null>(null)
  const savedFont = useStoredString(storageKey)
  const savedMode = useStoredString(MODE_KEY)
  const n = savedFont ? Number(savedFont) : initialFont
  const fontSize = fontOverride ?? (Number.isFinite(n) && n >= MIN_FONT && n <= MAX_FONT ? n : initialFont)
  const mode: Mode = modeOverride ?? (savedMode === 'sepia' || savedMode === 'dark' ? savedMode : 'default')
  const mounted = useHydrated()
  const toolbar = useRef<HTMLDivElement>(null)

  // The article shell has hydrated; its streamed reader content may still be pending.
  useEffect(() => {
    if (!mounted) return
    const article = toolbar.current?.closest('article')
    if (!article) return
    article.style.setProperty('--reader-font-size', fontSize + 'px')
    article.classList.remove('reader-mode-default', 'reader-mode-sepia', 'reader-mode-dark')
    article.classList.add('reader-mode-' + mode)
  }, [fontSize, mode, mounted])

  const changeFont = useCallback((delta: number) => {
    const next = Math.max(MIN_FONT, Math.min(MAX_FONT, fontSize + delta))
    setFontSize(next)
    try { localStorage.setItem(storageKey, String(next)); notifyStorageChange() } catch { /* Keep the current controls usable. */ }
  }, [fontSize, storageKey])
  const decreaseFont = () => changeFont(-STEP)
  const increaseFont = () => changeFont(STEP)
  const changeMode = (next: Mode) => {
    setMode(next)
    try { localStorage.setItem(MODE_KEY, next); notifyStorageChange() } catch { /* Keep the current controls usable. */ }
  }

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
