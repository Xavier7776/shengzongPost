// app/now/page.tsx
// /now 页面：当下在做什么（nownownow.com 惯例）
// 内容直接在此编辑，更新后改 updated_at 即可
import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Now — MindStack.',
  description: '我最近正在做的事情',
}

const UPDATED_AT = '2026-08-22'

interface NowItem {
  emoji: string
  title: string
  desc: string
}

const NOW_ITEMS: NowItem[] = [
  {
    emoji: '🤖',
    title: '折腾 AI Agent',
    desc: '持续关注 Agent Skills 生态，本站的 Skills & Trending 页每天自动爬取 GitHub 最新项目。',
  },
  {
    emoji: '✍️',
    title: '写博客',
    desc: '记录深度学习与工程实践中的思考，最近在整理 Agent 工作流相关的系列文章。',
  },
  {
    emoji: '📷',
    title: '摄影存档',
    desc: '视觉存档页面持续更新中，专注极简主义和城市光影。',
  },
]

export default function NowPage() {
  return (
    <div className="animate-in">
      <div className="max-w-3xl mx-auto px-6 py-16 md:py-24">
        <Link href="/" className="inline-flex items-center gap-2 text-xs font-black tracking-widest text-gray-400 hover:text-gray-900 transition-colors mb-10">
          <ArrowLeft className="w-4 h-4" />
          返回首页
        </Link>

        <p className="font-mono text-[10px] tracking-[0.45em] uppercase text-blue-600 mb-3">
          What I&apos;m doing now · 更新于 {UPDATED_AT}
        </p>
        <h1 className="text-5xl font-black tracking-tighter text-gray-900 mb-4">
          Now<span className="text-blue-600">.</span>
        </h1>
        <p className="text-base text-gray-500 leading-relaxed mb-14">
          灵感来自 <a href="https://nownownow.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline underline-offset-2">nownownow.com</a>
          ——比起社交媒体上「做过什么」，这里记录「正在做什么」。
        </p>

        <div className="space-y-4">
          {NOW_ITEMS.map((item, i) => (
            <div
              key={item.title}
              className="flex gap-5 p-6 rounded-2xl bg-white border border-gray-100 hover:border-blue-200 hover:shadow-md transition-all duration-300 animate-masonry-in"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <span className="text-3xl leading-none mt-0.5">{item.emoji}</span>
              <div>
                <h2 className="font-black text-lg text-gray-900 tracking-tight">{item.title}</h2>
                <p className="mt-1.5 text-sm text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
