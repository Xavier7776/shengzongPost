import { Mail, MapPin, Send, Github } from 'lucide-react'
import SectionHeading from '@/components/ui/SectionHeading'
import ProjectItem from '@/components/sections/ProjectItem'
import { PROJECTS } from '@/lib/data'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '个人主页',
  description: '全栈工程师 / AI Agent开发，专注于构建AGI智能系统。',
}

export default function ProjectsPage() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-24 animate-in">
      <SectionHeading>项目与关于</SectionHeading>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-20">
        {/* About sidebar */}
        <div className="lg:col-span-1">
          <div className="lg:sticky lg:top-32 space-y-12">
            <div>
              <div className="w-32 h-32 rounded-3xl bg-gray-200 mb-8 overflow-hidden transform transition-all duration-700 hover:rotate-6 hover:scale-110 shadow-xl border-4 border-white">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://test.fukit.cn/autoupload/f/T92c4TLzNe5wsXnw_T86nFaMnouKReN3spbQz7x5YEI/20260419/Es8n/940X940/%E5%BE%AE%E4%BF%A1%E5%9B%BE%E7%89%87_2026-04-19_105422_293.jpg"
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className="text-2xl font-black mb-2">张盛宗</h3>
              <p className="text-gray-500 font-medium mb-6">全栈工程师 / AI Agent开发</p>
              <p className="text-gray-600 leading-relaxed mb-8">
                专注于构建具有极致性能与美感的 Web 应用。梦想是构建AGI智能系统。
              </p>
              <div className="space-y-4">
                <a
                  href="mailto:leonidasholya@gmail.com"
                  className="flex items-center text-gray-500 text-sm font-medium hover:text-blue-600 transition-colors"
                >
                  <Mail className="w-4 h-4 mr-3 text-blue-600" />
                  leonidasholya@gmail.com
                </a>
                <a
                  href="https://github.com/Xavier7776"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center text-gray-500 text-sm font-medium hover:text-blue-600 transition-colors"
                >
                  <Github className="w-4 h-4 mr-3 text-blue-600" />
                  github.com/Xavier7776
                </a>
                <div className="flex items-center text-gray-500 text-sm font-medium">
                  <MapPin className="w-4 h-4 mr-3 text-blue-600" />
                  China
                </div>
              </div>
            </div>

            <a
              href="mailto:leonidasholya@gmail.com"
              className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition-all active:scale-95 shadow-lg shadow-blue-600/20 group"
            >
              <Send className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              开始合作
            </a>
          </div>
        </div>

        {/* Project list */}
        <div className="lg:col-span-2 space-y-8">
          {PROJECTS.map((project, i) => (
            <ProjectItem key={project.id} project={project} index={i} />
          ))}
        </div>
      </div>
    </div>
  )
}
