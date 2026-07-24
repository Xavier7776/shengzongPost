'use client'
// app/work/[slug]/WorkTocClient.tsx
// 项目详情页右侧悬浮目录客户端组件
// - IntersectionObserver 监听对应 h2 进入视口，active 高亮
// - 回到顶部按钮（滚动超过 600px 显示）
// - 接近页脚时淡出隐藏，避免覆盖页脚内容
import { useEffect, useState } from 'react'
import { ArrowUp } from 'lucide-react'

export interface TocItem {
  id: string
  text: string
}

export default function WorkTocClient({ toc }: { toc: TocItem[] }) {
  const [activeId, setActiveId] = useState<string>('')
  const [showTop, setShowTop] = useState(false)
  const [nearFooter, setNearFooter] = useState(false)

  useEffect(() => {
    if (toc.length === 0) return

    // 监听所有 h2 元素
    const headings = toc
      .map(t => document.getElementById(t.id))
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

    // 滚动监听：回到顶部按钮显隐 + 接近页脚时淡出
    function handleScroll() {
      setShowTop(window.scrollY > 600)
      // 当剩余可滚动距离 < 600px 时认为接近页脚，淡出目录
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
  }, [toc])

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (toc.length === 0) return null

  return (
    <div
      className={`transition-opacity duration-300 ${nearFooter ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
    >
      <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">目录</h3>
      <nav className="space-y-1.5 border-l border-gray-200 max-h-[60vh] overflow-y-auto">
        {toc.map(item => (
          <a
            key={item.id}
            href={`#${item.id}`}
            className={`block text-sm pl-3 -ml-px border-l-2 transition-colors leading-relaxed ${
              activeId === item.id
                ? 'border-blue-500 text-blue-600 font-bold'
                : 'border-transparent text-gray-500 hover:text-blue-600 hover:border-blue-300'
            }`}
          >
            {item.text}
          </a>
        ))}
      </nav>

      {showTop && (
        <button
          onClick={scrollToTop}
          className="mt-4 flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-blue-600 transition-colors"
          title="回到顶部"
        >
          <ArrowUp className="w-3.5 h-3.5" />
          回到顶部
        </button>
      )}
    </div>
  )
}
