'use client'

// components/sections/HeroClient.tsx
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react'

interface Slide {
  img: string
  title: string
  subtitle: string
}

export default function HeroClient({ slides }: { slides: Slide[] }) {
  const [current, setCurrent] = useState(0)
  const [mounted, setMounted] = useState(false)

  const list = slides.length > 0 ? slides : [{
    img: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=2000',
    title: '探索 AI 前沿',
    subtitle: '从 Transformer 到 Agent，记录深度学习领域的思考与实践。',
  }]

  const prev = useCallback(() => setCurrent(c => (c - 1 + list.length) % list.length), [list.length])
  const next = useCallback(() => setCurrent(c => (c + 1) % list.length), [list.length])

  useEffect(() => {
    setMounted(true)
    if (list.length <= 1) return
    const timer = setInterval(next, 5000)
    return () => clearInterval(timer)
  }, [list.length, next])

  return (
    <section className="relative bg-[#FAFAF8] pt-24 pb-16">
      {/* ── 顶部文字区 ── */}
      <div className="max-w-6xl mx-auto px-6 mb-8">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
          <span className="text-xs font-black tracking-widest uppercase text-blue-600">
            Available for work
          </span>
        </div>

        <div
          className={`transition-all duration-700 ${
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
          }`}
        >
          <h1 className="text-[clamp(2rem,5vw,4rem)] font-black tracking-tighter leading-[1.05] text-gray-900 mb-4 max-w-3xl">
            {list[current].title}
          </h1>
          <p className="text-base text-gray-500 leading-relaxed max-w-2xl">
            {list[current].subtitle}
          </p>
        </div>

        <div className="flex items-center gap-4 mt-8">
          <Link
            href="/projects"
            className="inline-flex items-center gap-2 bg-gray-900 text-white px-6 py-3 rounded-2xl font-bold text-sm hover:bg-blue-600 transition-all duration-300 group"
          >
            查看作品
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 border border-gray-200 text-gray-600 px-6 py-3 rounded-2xl font-bold text-sm hover:border-gray-400 hover:text-gray-900 transition-all duration-300"
          >
            技术随笔
          </Link>
        </div>
      </div>

      {/* ── 大图轮播区 ── */}
      <div className="max-w-6xl mx-auto px-6">
        <div className="relative rounded-3xl overflow-hidden aspect-[16/7] shadow-xl shadow-gray-200/60 bg-gray-100 group">

          {/* 图片层 */}
          {list.map((slide, idx) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={idx}
              src={slide.img}
              alt={slide.title}
              className={`absolute inset-0 w-full h-full object-cover transition-all duration-[1000ms] ease-in-out ${
                idx === current ? 'opacity-100 scale-100' : 'opacity-0 scale-[1.03]'
              }`}
            />
          ))}

          {/* 左翻页箭头 */}
          {list.length > 1 && (
            <>
              <button
                onClick={prev}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-md backdrop-blur-sm transition-all duration-200 hover:scale-110 z-10"
                aria-label="上一张"
              >
                <ChevronLeft className="w-5 h-5 text-gray-700" />
              </button>

              {/* 右翻页箭头 */}
              <button
                onClick={next}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-md backdrop-blur-sm transition-all duration-200 hover:scale-110 z-10"
                aria-label="下一张"
              >
                <ChevronRight className="w-5 h-5 text-gray-700" />
              </button>

              {/* 底部点指示器 */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 z-10">
                {list.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrent(idx)}
                    className={`h-1.5 rounded-full transition-all duration-500 ${
                      idx === current ? 'bg-white w-8' : 'bg-white/50 w-3 hover:bg-white/70'
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* 底部分隔线 */}
      <div className="max-w-6xl mx-auto px-6 mt-12">
        <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
      </div>
    </section>
  )
}
