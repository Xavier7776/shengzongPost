'use client'

// components/ui/CommandPalette.tsx
// ⌘K 命令面板：即时搜索文章/Skills/图片，键盘导航，回车直达

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, FileText, Sparkles, Image as ImageIcon, CornerDownLeft, ArrowUp, ArrowDown } from 'lucide-react'
import Image from 'next/image'

interface SearchResult {
  type: 'post' | 'skill' | 'gallery'
  id: string
  title: string
  excerpt: string
  url: string
  image: string | null
  meta: string
}

const TYPE_META = {
  post:    { label: '文章', icon: FileText,   color: 'text-blue-600 bg-blue-50' },
  skill:   { label: 'Skill', icon: Sparkles,  color: 'text-purple-600 bg-purple-50' },
  gallery: { label: '图片', icon: ImageIcon,  color: 'text-amber-600 bg-amber-50' },
} as const

const QUICK_LINKS = [
  { label: '首页', href: '/' },
  { label: '博客', href: '/blog' },
  { label: '热门 Skills', href: '/skills' },
  { label: '视觉存档', href: '/gallery' },
  { label: '作品集', href: '/work' },
]

export default function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [active, setActive] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  // 打开时聚焦 + 重置
  useEffect(() => {
    if (open) {
      setQuery('')
      setResults([])
      setActive(0)
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }, [open])

  // 防抖搜索
  useEffect(() => {
    const q = query.trim()
    if (!q) { setResults([]); return }
    setLoading(true)
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&limit=12`)
        const data = await res.json()
        setResults(data.results ?? [])
        setActive(0)
      } catch { /* 静默 */ }
      setLoading(false)
    }, 250)
    return () => clearTimeout(t)
  }, [query])

  // 键盘导航
  const total = results.length
  const go = useCallback((delta: number) => {
    setActive(a => Math.min(total - 1, Math.max(0, a + delta)))
  }, [total])

  const navigate = useCallback((url: string) => {
    onClose()
    router.push(url)
  }, [onClose, router])

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); onClose() }
      if (e.key === 'ArrowDown') { e.preventDefault(); go(1) }
      if (e.key === 'ArrowUp') { e.preventDefault(); go(-1) }
      if (e.key === 'Enter') {
        e.preventDefault()
        if (results[active]) navigate(results[active].url)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose, go, results, active, navigate])

  // active 项滚动到可见
  useEffect(() => {
    listRef.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: 'nearest' })
  }, [active])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[150] flex items-start justify-center pt-[12vh] px-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-palette-fade" />

      <div
        className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-palette-in"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-label="快速搜索"
      >
        {/* 输入框 */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
          <Search className={`w-5 h-5 shrink-0 ${loading ? 'text-blue-500 animate-pulse' : 'text-gray-300'}`} />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="搜索文章、Skills、图片…"
            className="flex-1 text-base font-medium text-gray-900 placeholder:text-gray-300 focus:outline-none"
          />
          <kbd className="text-[10px] font-mono text-gray-400 bg-gray-100 border border-gray-200 rounded px-1.5 py-0.5">ESC</kbd>
        </div>

        {/* 结果区 */}
        <div ref={listRef} className="max-h-[50vh] overflow-y-auto overscroll-contain">
          {!query.trim() ? (
            <div className="p-3">
              <p className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-gray-300">快捷入口</p>
              {QUICK_LINKS.map(l => (
                <button
                  key={l.href}
                  onClick={() => navigate(l.href)}
                  className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  {l.label}
                </button>
              ))}
            </div>
          ) : total === 0 && !loading ? (
            <div className="py-14 text-center space-y-1.5">
              <Search className="w-8 h-8 mx-auto text-gray-200" />
              <p className="text-sm font-bold text-gray-400">没有找到「{query}」相关内容</p>
            </div>
          ) : (
            <>
              {(['post', 'skill', 'gallery'] as const).map(type => {
                const group = results.filter(r => r.type === type)
                if (group.length === 0) return null
                const M = TYPE_META[type]
                return (
                  <div key={type} className="p-2">
                    <p className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-gray-300">{M.label}</p>
                    {group.map(r => {
                      const idx = results.indexOf(r)
                      const isActive = idx === active
                      const Icon = M.icon
                      return (
                        <button
                          key={r.id}
                          data-active={isActive}
                          onMouseEnter={() => setActive(idx)}
                          onClick={() => navigate(r.url)}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors ${isActive ? 'bg-blue-50' : ''}`}
                        >
                          {r.image ? (
                            <span className="relative w-10 h-10 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                              <Image src={r.image} alt="" fill sizes="40px" className="object-cover" unoptimized />
                            </span>
                          ) : (
                            <span className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${M.color}`}>
                              <Icon className="w-4 h-4" />
                            </span>
                          )}
                          <span className="min-w-0 flex-1">
                            <span className="block text-sm font-bold text-gray-900 truncate">{r.title}</span>
                            <span className="block text-xs text-gray-400 truncate">{r.excerpt || r.meta}</span>
                          </span>
                          {isActive && <CornerDownLeft className="w-3.5 h-3.5 text-blue-400 shrink-0" />}
                        </button>
                      )
                    })}
                  </div>
                )
              })}
              <div className="border-t border-gray-100 px-5 py-3">
                <button
                  onClick={() => navigate(`/search?q=${encodeURIComponent(query.trim())}`)}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700"
                >
                  在搜索页查看「{query.trim()}」的全部结果 →
                </button>
              </div>
            </>
          )}
        </div>

        {/* 底部快捷键提示 */}
        <div className="flex items-center gap-4 px-5 py-2.5 bg-gray-50 border-t border-gray-100 text-[10px] font-mono text-gray-400">
          <span className="flex items-center gap-1"><ArrowUp className="w-3 h-3" /><ArrowDown className="w-3 h-3" /> 选择</span>
          <span className="flex items-center gap-1"><CornerDownLeft className="w-3 h-3" /> 打开</span>
          <span>ESC 关闭</span>
        </div>
      </div>

      <style>{`
        @keyframes paletteFade { from { opacity: 0 } to { opacity: 1 } }
        @keyframes paletteIn { from { opacity: 0; transform: translateY(-8px) scale(0.98) } to { opacity: 1; transform: none } }
        .animate-palette-fade { animation: paletteFade 0.15s ease forwards }
        .animate-palette-in { animation: paletteIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards }
      `}</style>
    </div>
  )
}
