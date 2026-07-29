// app/work/[slug]/page.tsx
// 项目详情页：展示完整项目介绍（Markdown 渲染）
// 布局：单栏沉浸式（Hero 与正文同宽，正文居中可读宽度，目录悬浮右侧）
import Link from 'next/link'
import { marked } from 'marked'
import { ArrowLeft, ExternalLink, Github, Calendar, Layers, CheckCircle2 } from 'lucide-react'
import ReadingProgressBar from '@/components/sections/ReadingProgressBar'
import AttachmentList from '@/components/sections/AttachmentList'
import WorkTocClient from './WorkTocClient'
import { getProjectBySlug, getAllProjects } from '@/lib/db-works'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

// 项目详情内容变更频率低，长缓存
export const revalidate = 3600

// 配置 marked（与 skills 详情页一致，不使用自定义 renderer，避免 v18 兼容问题）
marked.setOptions({
  gfm: true,
  breaks: true,
})

function renderMarkdown(md: string): string {
  if (!md) return ''
  try {
    let html = marked.parse(md) as string
    // 后处理：给 h2 加 id（用于目录锚点跳转）
    // 匹配 <h2>...</h2>，提取纯文本生成 id
    html = html.replace(/<h2([^>]*)>(.*?)<\/h2>/g, (_match, attrs: string, content: string) => {
      // 提取纯文本（去除标签和 markdown 标记）
      const plain = content.replace(/<[^>]+>/g, '').replace(/[`*_~]/g, '').trim()
      // 生成锚点 id：移除中英文标点，空格转短横线
      const id = plain
        .replace(/[（）()，,。.、：:；;！!？?""''《》【】\[\]{}]/g, '')
        .replace(/\s+/g, '-')
        .toLowerCase()
      return `<h2${attrs} id="${id}">${content}</h2>`
    })
    return html
  } catch {
    return md
  }
}

// 从 Markdown 内容提取所有 h2 标题作为左侧目录
function extractToc(md: string): { id: string; text: string }[] {
  const lines = md.split('\n')
  const toc: { id: string; text: string }[] = []
  for (const line of lines) {
    const m = line.match(/^##\s+(.+)$/)
    if (m) {
      const text = m[1].replace(/[`*_]/g, '').trim()
      // 与 renderMarkdown 后处理中的 id 生成逻辑保持一致
      const id = text
        .replace(/[（）()，,。.、：:；;！!？?""''《》【】\[\]{}]/g, '')
        .replace(/\s+/g, '-')
        .toLowerCase()
      toc.push({ id, text })
    }
  }
  return toc
}

// 解析行内 Markdown（用于核心亮点等短文本，支持 **加粗**、`代码`、[链接](url) 等）
function renderInline(md: string): string {
  if (!md) return ''
  try {
    return marked.parseInline(md) as string
  } catch {
    return md
  }
}

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  const projects = await getAllProjects()
  return projects.map(p => ({ slug: p.slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const project = await getProjectBySlug(slug)
  if (!project) return { title: '项目未找到 - MindStack' }
  return {
    title: `${project.name} - MindStack`,
    description: project.description.slice(0, 160),
  }
}

export default async function ProjectDetailPage({ params }: PageProps) {
  const { slug } = await params
  const project = await getProjectBySlug(slug)
  if (!project) notFound()

  const hasContent = !!project.content?.trim()
  const toc = hasContent ? extractToc(project.content!) : []
  const contentHtml = hasContent ? renderMarkdown(project.content!) : ''
  // 自动注入 PDF 附件：有正文内容 或 附件中有 MD 文件时，都注入 PDF 项
  // PDF 内容来源（在 /work/[slug]/pdf 路由处理）：优先 fetch 附件 MD 文件 → 回退 project.content
  // PDF 文件名与 MD 附件文件名一致（去掉 .md 后缀加 .pdf），无 MD 附件时回退到 project.name
  const mdAttachment = (project.attachments ?? []).find(
    att => att.size > 0 && /\.md$/i.test(att.filename)
  )
  const hasMdAttachment = !!mdAttachment
  const pdfFilename = mdAttachment
    ? mdAttachment.filename.replace(/\.md$/i, '.pdf')
    : `${project.name}.pdf`
  const finalAttachments = (hasContent || hasMdAttachment)
    ? [
        { url: `/work/${project.slug}/pdf`, filename: pdfFilename, size: 0 },
        ...(project.attachments ?? []),
      ]
    : (project.attachments ?? [])

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      {/* 阅读进度条（复用博客阅读组件） */}
      <ReadingProgressBar />

      {/* Hero 区 —— 单栏沉浸式，宽度与正文一致 */}
      <header className="max-w-3xl mx-auto px-6 pt-12 pb-10">
        {/* 操作栏：返回作品集 + 外部链接 */}
        <div className="flex items-center justify-between mb-10">
          <Link
            href="/work"
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 text-sm font-bold transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            返回作品集
          </Link>
          <div className="flex items-center gap-3">
            {project.demoUrl && (
              <a
                href={project.demoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                在线预览
              </a>
            )}
            {project.githubUrl && (
              <a
                href={project.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs font-bold text-gray-600 hover:text-gray-900"
              >
                <Github className="w-3.5 h-3.5" />
                GitHub
              </a>
            )}
          </div>
        </div>

        {/* 标题区（单栏，居中可读宽度） */}
        {project.year && (
          <div className="flex items-center gap-1.5 text-xs font-bold text-gray-400 mb-3">
            <Calendar className="w-3.5 h-3.5" />
            {project.year}
          </div>
        )}
        <h1 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight mb-3 leading-tight">
          {project.name}
        </h1>
        {project.tagline && (
          <p className="text-lg text-blue-600 font-bold mb-5">{project.tagline}</p>
        )}
        {project.description && (
          <p className="text-gray-600 leading-relaxed mb-8">{project.description}</p>
        )}

        {/* 核心亮点（支持行内 Markdown：**加粗**、`代码`、[链接](url)） */}
        {project.highlights.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">核心亮点</h2>
            <ul className="space-y-2">
              {project.highlights.map(h => (
                <li key={h} className="flex items-start gap-2 text-sm text-gray-700">
                  <CheckCircle2 className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                  <span
                    className="prose-inline"
                    dangerouslySetInnerHTML={{ __html: renderInline(h) }}
                  />
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 技术栈（单栏内联展示，不再用右侧 sticky 卡片） */}
        {project.techStack.length > 0 && (
          <div>
            <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5" />
              技术栈
            </h2>
            <div className="flex flex-wrap gap-2">
              {project.techStack.map(t => (
                <span
                  key={t}
                  className="text-xs font-bold bg-white text-gray-700 px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        )}
      </header>

      {/* 主体内容：单栏沉浸式正文 + 右侧悬浮目录（fixed 定位，不占布局空间） */}
      {hasContent && (
        <div className="relative max-w-3xl mx-auto px-6 pb-24">
          {/* 右侧悬浮目录（桌面端，fixed 定位贴在页面右侧中间偏上，不占用文档流） */}
          {toc.length > 0 && (
            <div className="hidden xl:block fixed top-32 right-8 w-56 z-30">
              <WorkTocClient toc={toc} />
            </div>
          )}

          {/* Markdown 正文（单栏，居中可读宽度） */}
          <article
            className="prose prose-gray max-w-none"
            dangerouslySetInnerHTML={{ __html: contentHtml }}
          />

          {/* 附件下载区（PDF + md 文件 + 外链） */}
          <AttachmentList attachments={finalAttachments} />
        </div>
      )}

      {/* 无正文但有附件时，独立展示附件下载区 */}
      {!hasContent && finalAttachments.length > 0 && (
        <div className="max-w-3xl mx-auto px-6 pb-24">
          <AttachmentList attachments={finalAttachments} />
        </div>
      )}

      {/* 底部导航 */}
      <div className="border-t border-gray-100 bg-white">
        <div className="max-w-6xl mx-auto px-6 py-10 flex items-center justify-between">
          <Link
            href="/work"
            className="flex items-center gap-2 text-sm font-bold text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            返回作品集
          </Link>
          <Link
            href="/projects"
            className="flex items-center gap-2 text-sm font-bold text-gray-600 hover:text-gray-900 transition-colors"
          >
            关于我
          </Link>
        </div>
      </div>

      {/* Markdown 渲染样式（与 skills 详情页风格统一） */}
      <style dangerouslySetInnerHTML={{ __html: `
        .prose h1 { font-size: 2rem; font-weight: 900; color: #111827; margin: 2rem 0 1rem; letter-spacing: -0.02em; }
        .prose h2 { font-size: 1.5rem; font-weight: 800; color: #1f2937; margin: 2.5rem 0 1rem; padding-bottom: 0.5rem; border-bottom: 1px solid #e5e7eb; scroll-margin-top: 1rem; }
        .prose h3 { font-size: 1.2rem; font-weight: 700; color: #374151; margin: 1.5rem 0 0.75rem; }
        .prose p { color: #4b5563; line-height: 1.8; margin: 0.8rem 0; }
        .prose ul { list-style: disc; padding-left: 1.5rem; margin: 0.8rem 0; }
        .prose ol { list-style: decimal; padding-left: 1.5rem; margin: 0.8rem 0; }
        .prose li { color: #4b5563; line-height: 1.8; margin: 0.3rem 0; }
        .prose strong { color: #111827; font-weight: 700; }
        .prose code { background: #f3f4f6; color: #1f2937; padding: 0.15rem 0.4rem; border-radius: 0.25rem; font-size: 0.875em; font-family: var(--font-mono); }
        .prose pre { background: #1f2937; color: #f9fafb; padding: 1rem 1.25rem; border-radius: 0.5rem; overflow-x: auto; margin: 1rem 0; }
        .prose pre code { background: transparent; color: inherit; padding: 0; }
        .prose blockquote { border-left: 4px solid #3b82f6; padding-left: 1rem; color: #6b7280; margin: 1rem 0; font-style: italic; }
        .prose hr { border: 0; border-top: 1px solid #e5e7eb; margin: 2rem 0; }
        .prose a { color: #2563eb; text-decoration: underline; }
        .prose a:hover { color: #1d4ed8; }
        .prose table { width: 100%; border-collapse: collapse; margin: 1rem 0; font-size: 0.875rem; }
        .prose th, .prose td { border: 1px solid #e5e7eb; padding: 0.5rem 0.75rem; text-align: left; }
        .prose th { background: #f9fafb; font-weight: 700; color: #111827; }

        /* 核心亮点行内 Markdown 样式 */
        .prose-inline strong { color: #111827; font-weight: 700; }
        .prose-inline code { background: #f3f4f6; color: #1f2937; padding: 0.1rem 0.35rem; border-radius: 0.25rem; font-size: 0.85em; font-family: var(--font-mono); }
        .prose-inline a { color: #2563eb; text-decoration: underline; }
        .prose-inline a:hover { color: #1d4ed8; }
        .prose-inline em { font-style: italic; }
        .prose-inline del { text-decoration: line-through; color: #9ca3af; }
      `}} />
    </div>
  )
}
