'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { HERO_SLIDES } from '@/lib/data'

const TAGS = ['Next.js', 'TypeScript', 'Tailwind', 'Rust', 'UI Design']

export default function Hero() {
  const [current, setCurrent] = useState(0)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const timer = setInterval(() => setCurrent(c => (c + 1) % HERO_SLIDES.length), 5000)
    return () => clearInterval(timer)
  }, [])

  return (
    <section className="relative min-h-screen bg-[#FAFAF8] flex flex-col pt-24">
      {/* Top label strip */}
      <div className="max-w-6xl mx-auto w-full px-6 pt-8 pb-0 flex items-center justify-between">
        <span className="text-[10px] font-black tracking-[0.25em] uppercase text-gray-300">
          Portfolio — 2026
        </span>
        <span className="text-[10px] font-black tracking-[0.25em] uppercase text-gray-300">
          Full-stack & Design
        </span>
      </div>

      {/* Main hero grid */}
      <div className="max-w-6xl mx-auto w-full px-6 flex-1 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center py-16">
        {/* Left: text */}
        <div>
          <div className="flex items-center gap-3 mb-8">
            <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
            <span className="text-xs font-black tracking-widest uppercase text-blue-600">
              Available for work
            </span>
          </div>

          <h1
            className={`text-[clamp(3rem,8vw,6rem)] font-black tracking-tighter leading-[0.9] text-gray-900 mb-8 transition-all duration-700 ${
              mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
            }`}
          >
            {HERO_SLIDES[current].title}
          </h1>

          <p
            className={`text-lg text-gray-500 leading-relaxed max-w-md mb-12 transition-all duration-700 delay-100 ${
              mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
            }`}
          >
            {HERO_SLIDES[current].subtitle}
          </p>

          <div className="flex items-center gap-4">
            <Link
              href="/projects"
              className="inline-flex items-center gap-2 bg-gray-900 text-white px-6 py-3.5 rounded-2xl font-bold text-sm hover:bg-blue-600 transition-all duration-300 group"
            >
              查看作品
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 border border-gray-200 text-gray-600 px-6 py-3.5 rounded-2xl font-bold text-sm hover:border-gray-400 hover:text-gray-900 transition-all duration-300"
            >
              技术随笔
            </Link>
          </div>

          {/* Slide dots */}
          <div className="flex items-center gap-2 mt-12">
            {HERO_SLIDES.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrent(idx)}
                className={`h-1 rounded-full transition-all duration-500 ${
                  idx === current ? 'bg-gray-900 w-8' : 'bg-gray-200 w-4 hover:bg-gray-400'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Right: image card */}
        <div className="relative">
          {/* Decorative ring */}
          <div className="absolute -inset-4 rounded-3xl border border-gray-100" />
          <div className="absolute -inset-8 rounded-3xl border border-gray-50" />

          <div className="relative rounded-3xl overflow-hidden aspect-[4/3] shadow-2xl shadow-gray-200">
            {HERO_SLIDES.map((slide, idx) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={idx}
                src={slide.img}
                alt={slide.title}
                className={`absolute inset-0 w-full h-full object-cover transition-all duration-[1200ms] ease-in-out ${
                  idx === current ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
                }`}
              />
            ))}

            {/* Overlay label */}
            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-white/60 to-transparent backdrop-blur-[2px]">
              <div className="flex flex-wrap gap-2">
                {TAGS.map(tag => (
                  <span
                    key={tag}
                    className="text-[10px] font-black tracking-widest uppercase bg-white/80 text-gray-600 px-2.5 py-1 rounded-lg border border-white/60"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Floating stat card */}
          <div className="absolute -bottom-6 -left-6 bg-white rounded-2xl px-5 py-4 shadow-xl border border-gray-100">
            <p className="text-3xl font-black text-gray-900">3+</p>
            <p className="text-xs text-gray-400 font-bold tracking-wide mt-0.5">Years Experience</p>
          </div>

          {/* Floating projects badge */}
          <div className="absolute -top-4 -right-4 bg-blue-600 text-white rounded-2xl px-4 py-3 shadow-xl">
            <p className="text-2xl font-black">12</p>
            <p className="text-[10px] font-black tracking-widest uppercase opacity-80">Projects</p>
          </div>
        </div>
      </div>

      {/* Bottom divider */}
      <div className="max-w-6xl mx-auto w-full px-6 pb-8">
        <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
      </div>
    </section>
  )
}
