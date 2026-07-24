'use client'
// components/sections/WorkCard.tsx
// 个人项目展示卡片 —— 面向 HR 的作品集呈现
// 核心亮点移到详情页，卡片只保留：标题 / tagline / 描述 / 技术栈前 3 个 / CTA
import Image from 'next/image'
import Link from 'next/link'
import { useScrollReveal } from '@/lib/hooks'
import { ExternalLink, Github, ArrowRight } from 'lucide-react'

export interface WorkProject {
  slug: string
  name: string
  tagline: string
  description: string
  /** 项目详细介绍（Markdown 格式），详情页 /work/[slug] 用 marked 渲染 */
  content?: string | null
  cover: string
  techStack: string[]
  highlights: string[]
  demoUrl?: string | null
  githubUrl?: string | null
  year: string
  /** md 文件附件 + 外链列表（详情页显示下载按钮） */
  attachments?: { url: string; filename: string; size: number }[]
}

interface WorkCardProps {
  project: WorkProject
  index: number
}

const MAX_TECH_TAGS = 3  // 卡片最多展示 3 个技术栈，超出折叠为 +N

export default function WorkCard({ project, index }: WorkCardProps) {
  const [ref, isVisible] = useScrollReveal()
  // 交替布局：偶数索引图在左，奇数索引图在右
  const imageOnLeft = index % 2 === 0
  const detailHref = `/work/${project.slug}`

  const visibleTech = project.techStack.slice(0, MAX_TECH_TAGS)
  const hiddenTechCount = Math.max(0, project.techStack.length - MAX_TECH_TAGS)

  return (
    <div
      ref={ref}
      className={`transition-all duration-1000 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
      }`}
      style={{ transitionDelay: `${index * 120}ms` }}
    >
      <article className="group grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center bg-white rounded-3xl overflow-hidden border-2 border-gray-100/80 shadow-sm hover:shadow-lg hover:border-blue-400 hover:-translate-y-0.5 transition-all duration-300 p-6 lg:p-8">

        {/* 封面图 —— 整块可点击进详情 */}
        <Link
          href={detailHref}
          className={`relative aspect-[16/10] rounded-2xl overflow-hidden bg-gray-100 group ${imageOnLeft ? 'lg:order-1' : 'lg:order-2'}`}
        >
          <Image
            src={project.cover}
            alt={project.name}
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
            {/* 年份角标 */}
            <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-lg text-xs font-black text-gray-700 tracking-wider">
              {project.year}
            </div>
            {/* 悬停查看详情提示 */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
              <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-xl text-xs font-black text-gray-900 flex items-center gap-1.5">
                <ArrowRight className="w-3.5 h-3.5" />
                查看详情
              </span>
            </div>
        </Link>

        {/* 文字内容 —— 标题与副标题可点击进详情 */}
        <div className={`flex flex-col ${imageOnLeft ? 'lg:order-2' : 'lg:order-1'}`}>
          <Link href={detailHref} className="group/text">
            <h3 className="text-2xl lg:text-3xl font-black text-gray-900 mb-2 tracking-tight group-hover/text:text-blue-600 transition-colors">
              {project.name}
            </h3>
            <p className="text-blue-600 font-bold text-sm mb-4 tracking-wide">
              {project.tagline}
            </p>
            <p className="text-gray-600 leading-relaxed mb-5 text-sm lg:text-base">
              {project.description}
            </p>
          </Link>

          {/* 技术栈（最多展示 3 个，超出折叠为 +N；完整列表见详情页） */}
          {project.techStack.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {visibleTech.map(t => (
                <span
                  key={t}
                  className="text-[11px] font-bold bg-gray-50 text-gray-600 px-2.5 py-1 rounded-md border border-gray-100"
                >
                  {t}
                </span>
              ))}
              {hiddenTechCount > 0 && (
                <Link
                  href={detailHref}
                  className="text-[11px] font-bold bg-blue-50 text-blue-600 px-2.5 py-1 rounded-md border border-blue-100 hover:bg-blue-100 transition-colors"
                >
                  +{hiddenTechCount}
                </Link>
              )}
            </div>
          )}

          {/* 外链按钮 */}
          <div className="flex items-center gap-3 mt-auto">
            <Link
              href={detailHref}
              className="inline-flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-colors"
            >
              <ArrowRight className="w-4 h-4" />
              查看详情
            </Link>
            {project.demoUrl && (
              <a
                href={project.demoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-colors shadow-lg shadow-blue-600/20"
              >
                <ExternalLink className="w-4 h-4" />
                在线预览
              </a>
            )}
            {project.githubUrl && (
              <a
                href={project.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-bold px-5 py-2.5 rounded-xl transition-colors"
              >
                <Github className="w-4 h-4" />
                源码
              </a>
            )}
          </div>
        </div>
      </article>
    </div>
  )
}
