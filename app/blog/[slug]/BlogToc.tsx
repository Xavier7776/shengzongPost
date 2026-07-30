'use client'
// 博客文章目录（Table of Contents）
// - 从文章 DOM 提取 h2/h3 生成目录
// - IntersectionObserver 实现滚动跟随高亮
// - 点击目录项平滑滚动到对应位置
// - 参考 WorkTocClient.tsx 的实现模式
// - 桌面端固定在右侧，移动端隐藏
import { useEffect, useState } from 'react'

interface TocItem {
  id: string
  text: string
  level: number // 2 或 3
}

export default function BlogToc() {
  const [items, setItems] = useState<TocItem[]>([])
  const [activeId, setActiveId] = useState<string>('')
  const [nearFooter, setNearFooter] = useState(false)

  // 从文章 DOM 提取 h2/h3 标题生成目录
  // 由于 PostContent 在 Suspense 中加载，需要轮询等待内容出现
  useEffect(() => {
    let attempts = 0
    const maxAttempts = 15

    function tryExtract() {
      const container = document.querySelector('.reader-content')
      if (!container) {
        attempts++
        if (attempts < maxAttempts) setTimeout(tryExtract, 200)
        return
      }
      const headings = container.querySelectorAll('h2, h3')
      if (headings.length === 0) {
        attempts++
        if (attempts < maxAttempts) setTimeout(tryExtract, 200)
        return
      }

      const parsed: TocItem[] = []
      headings.forEach((el, i) => {
        const level = el.tagName === 'H2' ? 2 : 3
        const text = el.textContent?.trim() || ''
        if (!text) return
        // 确保标题有 id，便于锚点跳转
        if (!el.id) {
          el.id = `blog-toc-heading-${i}`
        }
        parsed.push({ id: el.id, text, level })
      })

      if (parsed.length > 0) {
        setItems(parsed)
      }
    }

    tryExtract()
  }, [])

  // IntersectionObserver：监听标题进入视口，高亮对应目录项
  useEffect(() => {
    if (items.length === 0) return

    const headings = items
      .map(item => document.getElementById(item.id))
      .filter((el): el is HTMLElement => el !== null)

    if (headings.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter(e => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible.length > 0) {
          setActiveId(visible[0].target.id)
        }
      },
      { rootMargin: '-100px 0px -60% 0px', threshold: 0 }
    )

    headings.forEach(h => observer.observe(h))

    // 滚动监听：接近页脚时淡出目录
    function handleScroll() {
      const scrollBottom = window.scrollY + window.innerHeight
      const docHeight = document.documentElement.scrollHeight
      setNearFooter(docHeight - scrollBottom < 600)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()

    return () => {
      observer.disconnect()
      window.removeEventListener('scroll', handleScroll)
    }
  }, [items])

  // 点击目录项：平滑滚动到对应标题
  function handleClick(id: string) {
    const el = document.getElementById(id)
    if (!el) return
    const y = el.getBoundingClientRect().top + window.scrollY - 100
    window.scrollTo({ top: y, behavior: 'smooth' })
  }

  if (items.length === 0) return null

  return (
    <nav
      className={`hidden xl:block fixed z-20 transition-opacity duration-300 ${
        nearFooter ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      style={{
        top: 120,
        right: 'max(24px, calc((100vw - 900px) / 2 - 220px))',
        width: 200,
        maxHeight: 'calc(100vh - 160px)',
      }}
    >
      <h3 className="mb-3 text-xs font-black uppercase tracking-widest text-gray-400">目录</h3>
      <ul className="max-h-[60vh] space-y-1 overflow-y-auto border-l border-gray-200">
        {items.map(item => {
          const isActive = activeId === item.id
          return (
            <li key={item.id} style={{ marginLeft: item.level === 3 ? 16 : 0 }}>
              <button
                onClick={() => handleClick(item.id)}
                className={`block w-full border-l-2 pl-3 text-left text-sm leading-relaxed transition-colors -ml-px ${
                  isActive
                    ? 'border-blue-500 font-bold text-blue-600'
                    : 'border-transparent text-gray-500 hover:border-blue-300 hover:text-blue-600'
                }`}
                style={{ fontSize: item.level === 3 ? 12 : 13 }}
              >
                {item.text}
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
