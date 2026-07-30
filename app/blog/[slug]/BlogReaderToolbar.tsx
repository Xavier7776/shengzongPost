'use client'
// 博客阅读工具栏：字号调节 + 阅读模式切换
// - 字号范围 14~24px，步进 2px，默认 16px
// - 阅读模式：默认 / 护眼 / 深色
// - 使用 localStorage 持久化用户选择
// - 仅影响文章正文区域（.reader-content）
import { useEffect, useState, useCallback } from 'react'
import { Minus, Plus, Sun, BookOpen, Moon } from 'lucide-react'

const FONT_KEY = 'blog-reader-font-size'
const MODE_KEY = 'blog-reader-mode'

const MIN_FONT = 14
const MAX_FONT = 24
const DEFAULT_FONT = 16
const STEP = 2

type Mode = 'default' | 'sepia' | 'dark'

const MODES: { value: Mode; label: string; icon: typeof Sun }[] = [
  { value: 'default', label: '默认', icon: Sun },
  { value: 'sepia', label: '护眼', icon: BookOpen },
  { value: 'dark', label: '深色', icon: Moon },
]

export default function BlogReaderToolbar() {
  const [fontSize, setFontSize] = useState(DEFAULT_FONT)
  const [mode, setMode] = useState<Mode>('default')
  const [mounted, setMounted] = useState(false)

  // 初始化：从 localStorage 读取用户偏好
  useEffect(() => {
    const savedFont = localStorage.getItem(FONT_KEY)
    if (savedFont) {
      const n = Number(savedFont)
      if (!Number.isNaN(n) && n >= MIN_FONT && n <= MAX_FONT) {
        setFontSize(n)
      }
    }
    const savedMode = localStorage.getItem(MODE_KEY) as Mode | null
    if (savedMode && ['default', 'sepia', 'dark'].includes(savedMode)) {
      setMode(savedMode)
    }
    setMounted(true)
  }, [])

  // 将字号和阅读模式应用到文章正文容器
  useEffect(() => {
    if (!mounted) return
    const container = document.querySelector('.reader-content') as HTMLElement | null
    if (!container) return
    // 字号：通过 CSS 变量控制
    container.style.setProperty('--reader-font-size', `${fontSize}px`)
    // 阅读模式：切换 class
    container.classList.remove('reader-mode-default', 'reader-mode-sepia', 'reader-mode-dark')
    container.classList.add(`reader-mode-${mode}`)
  }, [fontSize, mode, mounted])

  const decreaseFont = useCallback(() => {
    setFontSize(prev => {
      const next = Math.max(MIN_FONT, prev - STEP)
      localStorage.setItem(FONT_KEY, String(next))
      return next
    })
  }, [])

  const increaseFont = useCallback(() => {
    setFontSize(prev => {
      const next = Math.min(MAX_FONT, prev + STEP)
      localStorage.setItem(FONT_KEY, String(next))
      return next
    })
  }, [])

  const changeMode = useCallback((m: Mode) => {
    setMode(m)
    localStorage.setItem(MODE_KEY, m)
  }, [])

  if (!mounted) return null

  return (
    <div className="sticky top-20 z-30 mb-6 flex items-center gap-3 rounded-xl border border-gray-100 bg-white/80 px-4 py-2 shadow-sm backdrop-blur-md">
      {/* 字号调节 */}
      <div className="flex items-center gap-1.5">
        <span className="mr-1 text-[10px] font-black uppercase tracking-widest text-gray-400">字号</span>
        <button
          onClick={decreaseFont}
          disabled={fontSize <= MIN_FONT}
          className="flex h-7 w-7 items-center justify-center rounded-md border border-gray-200 text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
          title="缩小字号"
          aria-label="缩小字号"
        >
          <Minus className="h-3.5 w-3.5" />
        </button>
        <span className="min-w-[2rem] text-center text-xs font-mono font-bold text-gray-700">{fontSize}px</span>
        <button
          onClick={increaseFont}
          disabled={fontSize >= MAX_FONT}
          className="flex h-7 w-7 items-center justify-center rounded-md border border-gray-200 text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
          title="放大字号"
          aria-label="放大字号"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* 分隔线 */}
      <div className="h-5 w-px bg-gray-200" />

      {/* 阅读模式 */}
      <div className="flex items-center gap-1">
        <span className="mr-1 text-[10px] font-black uppercase tracking-widest text-gray-400">模式</span>
        {MODES.map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            onClick={() => changeMode(value)}
            className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs font-bold transition-colors ${
              mode === value
                ? 'bg-blue-600 text-white'
                : 'border border-gray-200 text-gray-500 hover:bg-gray-50'
            }`}
            title={`${label}模式`}
            aria-label={`${label}模式`}
          >
            <Icon className="h-3 w-3" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
