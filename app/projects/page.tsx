import { Mail, MapPin, Send } from 'lucide-react'
import SectionHeading from '@/components/ui/SectionHeading'
import ProjectItem from '@/components/sections/ProjectItem'
import { PROJECTS } from '@/lib/data'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '项目与关于 — ARC.',
  description: '全栈工程师 / UI 设计师，专注于构建具有极致性能与美感的 Web 应用',
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
                  src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200"
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className="text-2xl font-black mb-2">ARC Designer</h3>
              <p className="text-gray-500 font-medium mb-6">全栈工程师 / UI 设计师</p>
              <p className="text-gray-600 leading-relaxed mb-8">
                专注于构建具有极致性能与美感的 Web 应用。深耕 React 生态，对极简主义交互有近乎偏执的追求。
              </p>
              <div className="space-y-4">
                <div className="flex items-center text-gray-500 text-sm font-medium">
                  <Mail className="w-4 h-4 mr-3 text-blue-600" />
                  hello@arc.design
                </div>
                <div className="flex items-center text-gray-500 text-sm font-medium">
                  <MapPin className="w-4 h-4 mr-3 text-blue-600" />
                  Tokyo, Japan
                </div>
              </div>
            </div>

            <button className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition-all active:scale-95 shadow-lg shadow-blue-600/20 group">
              <Send className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              开始合作
            </button>
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
