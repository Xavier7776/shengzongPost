// app/work/page.tsx
// 个人项目展示页 —— 面向 HR 的作品集
import Link from 'next/link'
import Image from 'next/image'
import { Github, Mail, ArrowRight, Sparkles, Code2, Rocket, Send } from 'lucide-react'
import SectionHeading from '@/components/ui/SectionHeading'
import WorkCard from '@/components/sections/WorkCard'
import { getAllProjects } from '@/lib/db-works'
import type { Metadata } from 'next'

// 项目数据变更频率低，长缓存 + 按需失效
export const revalidate = 3600

export const metadata: Metadata = {
  title: '个人项目 - MindStack',
  description: '全栈工程师 Xavier 的个人项目作品集，涵盖 Web 全栈、AI Agent、深度研究系统等方向。',
}

export default async function WorkPage() {
  const projects = await getAllProjects()

  return (
    <div className="max-w-6xl mx-auto px-6 py-24 animate-in">

      {/* ── Hero 区 ── */}
      <section className="mb-24">
        <SectionHeading>个人项目</SectionHeading>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
          <div className="lg:col-span-2">
            <p className="text-lg text-gray-600 leading-relaxed mb-6">
              我是 <span className="font-black text-gray-900">Xavier</span>，一名专注于
              <span className="text-blue-600 font-bold"> AI Agent 工程</span>的开发者，擅长构建
              <span className="text-blue-600 font-bold"> Agentic RAG 系统</span>、
              <span className="text-blue-600 font-bold">多智能体协作</span>与
              <span className="text-blue-600 font-bold">长期记忆架构</span>。以下是我近期的代表项目。
            </p>
            <div className="flex flex-wrap gap-3">
              <a
                href="https://github.com/Xavier7776"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-colors"
              >
                <Github className="w-4 h-4" />
                GitHub 主页
              </a>
              <a
                href="mailto:leonidasholya@gmail.com"
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-colors shadow-lg shadow-blue-600/20"
              >
                <Mail className="w-4 h-4" />
                联系我
              </a>
            </div>
          </div>

          {/* 能力标签卡 */}
          <div className="space-y-3">
            {[
              { icon: Code2, title: '全栈开发', desc: 'Next.js / React / TypeScript / PostgreSQL' },
              { icon: Sparkles, title: 'AI Agent 工程', desc: 'LangGraph / 多模型编排 / 工具调用' },
              { icon: Rocket, title: '性能与体验', desc: 'ISR / next/image / 3D 交互 / 动效' },
            ].map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="flex items-start gap-3 bg-white rounded-2xl border border-gray-100 p-4 hover:shadow-md transition-shadow"
              >
                <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4.5 h-4.5 text-blue-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-black text-gray-900">{title}</p>
                  <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 项目列表 ── */}
      <section className="space-y-12">
        <div className="flex items-baseline justify-between">
          <h2 className="text-xl font-black text-gray-900 tracking-tight">代表作品</h2>
          <span className="text-xs text-gray-400 font-semibold">共 {projects.length} 个项目</span>
        </div>
        {projects.map((project, i) => (
          <WorkCard key={project.slug} project={project} index={i} />
        ))}
      </section>

      {/* ── 底部 CTA ── */}
      <section className="mt-24 pt-16 border-t border-gray-100 text-center">
        <h2 className="text-2xl md:text-3xl font-black text-gray-900 mb-4 tracking-tight">
          想了解更多细节？
        </h2>
        <p className="text-gray-500 leading-relaxed mb-8 max-w-xl mx-auto">
          欢迎浏览我的技术博客，或直接邮件联系 —— 我会在 24 小时内回复。
        </p>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white text-sm font-bold px-6 py-3 rounded-xl transition-colors"
          >
            浏览博客
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/projects#contact"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-6 py-3 rounded-xl transition-all active:scale-95 shadow-lg shadow-blue-600/20 group"
          >
            <Send className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
            开始合作
          </Link>
        </div>
      </section>
    </div>
  )
}
