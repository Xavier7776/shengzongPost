// app/skills/[slug]/page.tsx
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Star, Clock, ExternalLink, Github, Globe, Tag, Layers, BookOpen, Zap, Target, Users, Rocket } from 'lucide-react'
import { getSkillBySlug } from '@/lib/db-skills'
import BackToTop from '@/components/ui/BackToTop'
import type { Metadata } from 'next'
import { marked } from 'marked'

export const dynamic = 'force-dynamic'
export const revalidate = 3600 // 1小时缓存

interface PageProps { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const skill = await getSkillBySlug(slug)
  if (!skill) return { title: '技能不存在 — MindStack.' }
  return { title: `${skill.name} — MindStack.`, description: skill.chinese_summary ?? skill.description ?? undefined }
}

const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  coding:       { bg: 'bg-blue-50',   text: 'text-blue-600',   border: 'border-blue-200' },
  research:     { bg: 'bg-violet-50', text: 'text-violet-600', border: 'border-violet-200' },
  creative:     { bg: 'bg-pink-50',   text: 'text-pink-600',   border: 'border-pink-200' },
  automation:   { bg: 'bg-amber-50',  text: 'text-amber-600',  border: 'border-amber-200' },
  productivity: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200' },
  other:        { bg: 'bg-gray-50',   text: 'text-gray-500',   border: 'border-gray-200' },
}

const CATEGORY_LABELS: Record<string, string> = {
  coding: '编程开发',
  research: '学术研究',
  creative: '创意设计',
  automation: '自动化',
  productivity: '效率工具',
  other: 'AI 工具',
}

const SOURCE_ICON: Record<string, typeof Github> = {
  github: Github,
}

function formatDate(iso: string) {
  return iso.slice(0, 10)
}

// 从 README 提取特性列表
function extractFeatures(content: string): string[] {
  if (!content) return []
  const features: string[] = []
  const lines = content.split('\n')
  
  for (const line of lines) {
    const trimmed = line.trim()
    if ((trimmed.startsWith('- ') || trimmed.startsWith('* ')) && trimmed.length > 10) {
      const feature = trimmed.slice(2).replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/[*_`]/g, '')
      if (feature.length > 5 && feature.length < 150) {
        features.push(feature)
      }
    }
    if (features.length >= 6) break
  }
  return features
}

// 配置 marked
marked.setOptions({
  gfm: true, // GitHub Flavored Markdown
  breaks: true, // 换行转换为 <br>
})

// 将 Markdown 转为 HTML
function renderMarkdown(md: string): string {
  if (!md) return ''
  try {
    return marked.parse(md) as string
  } catch {
    return md
  }
}

export default async function SkillDetailPage({ params }: PageProps) {
  const { slug } = await params
  const skill = await getSkillBySlug(slug)
  if (!skill) notFound()

  const cat = CATEGORY_COLORS[skill.category] ?? CATEGORY_COLORS.other
  const catLabel = CATEGORY_LABELS[skill.category] ?? 'AI 工具'
  const SourceIcon = SOURCE_ICON[skill.source_type] ?? Globe

  // 提取特性
  const features = extractFeatures(skill.content || '')

  // 将内容转换为 HTML
  const contentHtml = renderMarkdown(skill.content || '')

  // JSON-LD 结构化数据（SoftwareApplication schema）
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: skill.name,
    description: skill.chinese_summary ?? skill.description ?? undefined,
    applicationCategory: 'DeveloperApplication',
    operatingSystem: 'Cross-Platform',
    url: skill.source_url,
    downloadUrl: skill.source_url,
    dateModified: skill.updated_at,
    aggregateRating: skill.stars > 0 ? {
      '@type': 'AggregateRating',
      ratingValue: Math.min(5, Math.max(1, Math.round(skill.stars / 1000))).toFixed(1),
      ratingCount: skill.stars,
    } : undefined,
    keywords: skill.tags?.join(', '),
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <BackToTop />

      <div className="min-h-screen pt-24 pb-16">
        <div className="max-w-[860px] mx-auto px-6 lg:px-8">
          {/* 返回按钮 */}
          <Link
            href="/skills"
            className="inline-flex items-center text-gray-400 hover:text-blue-600 transition-colors mb-8 group font-bold uppercase tracking-widest text-xs"
          >
            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-2 transition-transform duration-300" />
            返回技能列表
          </Link>

          {/* ── 头部卡片 ── */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 mb-8">
            {/* 分类 + 来源 */}
            <div className="flex items-center gap-3 mb-5">
              <span className={`text-[10px] font-black tracking-widest uppercase ${cat.bg} ${cat.text} ${cat.border} border px-2.5 py-1 rounded-lg`}>
                {catLabel}
              </span>
              <span className="flex items-center gap-1.5 text-sm text-gray-400">
                <SourceIcon className="w-4 h-4" />
                {skill.source_type}
              </span>
            </div>

            {/* 名称 */}
            <h1 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight mb-5 leading-tight">
              {skill.name}
            </h1>

            {/* 中文简介 - 醒目显示 */}
            {skill.chinese_summary && (
              <p className="text-lg text-gray-700 leading-relaxed mb-6 font-medium">
                {skill.chinese_summary}
              </p>
            )}

            {/* 元信息网格 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-5 border-t border-gray-100">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                <div>
                  <div className="text-sm font-bold text-gray-900">{skill.stars.toLocaleString()}</div>
                  <div className="text-[10px] text-gray-400 uppercase tracking-wider">Stars</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-400" />
                <div>
                  <div className="text-sm font-bold text-gray-900">{formatDate(skill.updated_at)}</div>
                  <div className="text-[10px] text-gray-400 uppercase tracking-wider">更新时间</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-gray-400" />
                <div>
                  <div className="text-sm font-bold text-gray-900">{skill.tags.length}</div>
                  <div className="text-[10px] text-gray-400 uppercase tracking-wider">标签数</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-gray-400" />
                <div>
                  <div className="text-sm font-bold text-gray-900">{skill.content ? Math.ceil(skill.content.length / 500) : 0}</div>
                  <div className="text-[10px] text-gray-400 uppercase tracking-wider">阅读分钟</div>
                </div>
              </div>
            </div>

            {/* 标签 */}
            {skill.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-5 pt-5 border-t border-gray-100">
                {skill.tags.map(t => (
                  <span
                    key={t}
                    className="text-xs font-bold uppercase tracking-widest bg-gray-50 text-gray-500 px-3 py-1 rounded-lg border border-gray-100 flex items-center gap-1.5"
                  >
                    <Tag className="w-3 h-3" />
                    {t}
                  </span>
                ))}
              </div>
            )}

            {/* 来源链接 */}
            <a
              href={skill.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mt-5 px-4 py-2 bg-gray-900 text-white text-sm font-bold rounded-xl hover:bg-gray-800 transition-colors"
            >
              <Github className="w-4 h-4" />
              查看 GitHub 仓库
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* ── 中文详细介绍 ── */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 mb-8">
            <h2 className="text-xl font-black text-gray-900 mb-6 pb-3 border-b border-gray-100 flex items-center gap-2">
              <Zap className="w-5 h-5 text-blue-500" />
              详细介绍
            </h2>

            {/* 项目简介 */}
            <div className="mb-6">
              <h3 className="text-base font-bold text-gray-800 mb-2 flex items-center gap-2">
                <Target className="w-4 h-4 text-blue-500" />
                项目简介
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {skill.chinese_summary || skill.description || '暂无简介'}
              </p>
            </div>

            {/* 主要特性 */}
            {features.length > 0 && (
              <div className="mb-6">
                <h3 className="text-base font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <Rocket className="w-4 h-4 text-blue-500" />
                  主要特性
                </h3>
                <ul className="space-y-2">
                  {features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-gray-600">
                      <span className="text-blue-500 mt-1.5 flex-shrink-0">•</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* 适用场景 */}
            <div className="mb-6">
              <h3 className="text-base font-bold text-gray-800 mb-3 flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-500" />
                适用场景
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {skill.category === 'coding' && (
                  <>
                    <div className="bg-blue-50 rounded-xl p-3 text-sm text-blue-800">代码审查与优化</div>
                    <div className="bg-blue-50 rounded-xl p-3 text-sm text-blue-800">自动化测试编写</div>
                    <div className="bg-blue-50 rounded-xl p-3 text-sm text-blue-800">文档生成与维护</div>
                    <div className="bg-blue-50 rounded-xl p-3 text-sm text-blue-800">代码重构建议</div>
                  </>
                )}
                {skill.category === 'research' && (
                  <>
                    <div className="bg-violet-50 rounded-xl p-3 text-sm text-violet-800">论文阅读与总结</div>
                    <div className="bg-violet-50 rounded-xl p-3 text-sm text-violet-800">实验设计与分析</div>
                    <div className="bg-violet-50 rounded-xl p-3 text-sm text-violet-800">文献综述生成</div>
                    <div className="bg-violet-50 rounded-xl p-3 text-sm text-violet-800">数据可视化</div>
                  </>
                )}
                {skill.category === 'automation' && (
                  <>
                    <div className="bg-amber-50 rounded-xl p-3 text-sm text-amber-800">工作流自动化</div>
                    <div className="bg-amber-50 rounded-xl p-3 text-sm text-amber-800">任务调度与执行</div>
                    <div className="bg-amber-50 rounded-xl p-3 text-sm text-amber-800">数据处理管道</div>
                    <div className="bg-amber-50 rounded-xl p-3 text-sm text-amber-800">定时任务管理</div>
                  </>
                )}
                {skill.category === 'creative' && (
                  <>
                    <div className="bg-pink-50 rounded-xl p-3 text-sm text-pink-800">内容创作辅助</div>
                    <div className="bg-pink-50 rounded-xl p-3 text-sm text-pink-800">设计稿生成</div>
                    <div className="bg-pink-50 rounded-xl p-3 text-sm text-pink-800">创意方案构思</div>
                    <div className="bg-pink-50 rounded-xl p-3 text-sm text-pink-800">多媒体处理</div>
                  </>
                )}
                {skill.category === 'productivity' && (
                  <>
                    <div className="bg-emerald-50 rounded-xl p-3 text-sm text-emerald-800">日程管理优化</div>
                    <div className="bg-emerald-50 rounded-xl p-3 text-sm text-emerald-800">邮件自动处理</div>
                    <div className="bg-emerald-50 rounded-xl p-3 text-sm text-emerald-800">会议纪要生成</div>
                    <div className="bg-emerald-50 rounded-xl p-3 text-sm text-emerald-800">知识库构建</div>
                  </>
                )}
                {skill.category === 'other' && (
                  <>
                    <div className="bg-gray-50 rounded-xl p-3 text-sm text-gray-800">AI 能力扩展</div>
                    <div className="bg-gray-50 rounded-xl p-3 text-sm text-gray-800">工具集成对接</div>
                    <div className="bg-gray-50 rounded-xl p-3 text-sm text-gray-800">自定义技能开发</div>
                    <div className="bg-gray-50 rounded-xl p-3 text-sm text-gray-800">工作流优化</div>
                  </>
                )}
              </div>
            </div>

            {/* 快速开始 */}
            <div>
              <h3 className="text-base font-bold text-gray-800 mb-3 flex items-center gap-2">
                <Rocket className="w-4 h-4 text-blue-500" />
                快速开始
              </h3>
              <div className="bg-gray-900 rounded-xl p-4 text-sm">
                <code className="text-green-400">
                  {skill.source_type === 'github' ? (
                    <>
                      <span className="text-gray-500"># 克隆仓库</span><br />
                      git clone {skill.source_url}<br />
                      <span className="text-gray-500"># 进入目录</span><br />
                      cd {skill.name}<br />
                      <span className="text-gray-500"># 查看文档</span><br />
                      cat README.md
                    </>
                  ) : (
                    <>访问项目主页了解安装和使用方法</>
                  )}
                </code>
              </div>
            </div>
          </div>

          {/* ── 原文内容 ── */}
          {skill.content ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
              <h2 className="text-xl font-black text-gray-900 mb-6 pb-3 border-b border-gray-100 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-gray-400" />
                原文 README
              </h2>
              <div
                className="skill-content text-gray-600 leading-[1.9] text-[1rem]"
                dangerouslySetInnerHTML={{ __html: contentHtml }}
              />
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
              <Globe className="w-16 h-16 mx-auto mb-4 text-gray-200" />
              <p className="text-gray-400 mb-4">暂无原文内容</p>
              <a
                href={skill.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline text-sm"
              >
                前往 GitHub 查看完整信息 →
              </a>
            </div>
          )}
        </div>
      </div>

      {/* 内容样式 */}
      <style dangerouslySetInnerHTML={{ __html: `
        .skill-content h1 { font-size: 1.5rem; font-weight: 800; color: #111827; margin: 2rem 0 1rem; }
        .skill-content h2 { font-size: 1.25rem; font-weight: 700; color: #111827; margin: 1.5rem 0 0.75rem; padding-bottom: 0.5rem; border-bottom: 1px solid #f3f4f6; }
        .skill-content h3 { font-size: 1.1rem; font-weight: 600; color: #1f2937; margin: 1.25rem 0 0.5rem; }
        .skill-content p { margin-bottom: 1rem; }
        .skill-content ul, .skill-content ol { margin: 0.75rem 0; padding-left: 1.5rem; }
        .skill-content li { margin-bottom: 0.25rem; }
        .skill-content pre { background: #1a1a2e; color: #4ade80; padding: 1rem; border-radius: 0.75rem; overflow-x: auto; margin: 1rem 0; font-size: 0.875rem; }
        .skill-content code { background: #f3f4f6; color: #e11d48; padding: 0.125rem 0.375rem; border-radius: 0.25rem; font-size: 0.875rem; font-family: monospace; }
        .skill-content pre code { background: transparent; color: inherit; padding: 0; }
        .skill-content blockquote { border-left: 4px solid #60a5fa; padding: 0.75rem 1rem; margin: 1rem 0; background: #eff6ff; border-radius: 0 0.5rem 0.5rem 0; color: #4b5563; font-style: italic; }
        .skill-content a { color: #3b82f6; text-decoration: none; }
        .skill-content a:hover { text-decoration: underline; }
        .skill-content img { max-width: 100%; border-radius: 0.75rem; margin: 1rem 0; }
        .skill-content table { width: 100%; border-collapse: collapse; margin: 1rem 0; }
        .skill-content th, .skill-content td { border: 1px solid #e5e7eb; padding: 0.5rem 0.75rem; text-align: left; }
        .skill-content th { background: #f9fafb; font-weight: 600; }
        .skill-content hr { border: none; border-top: 1px solid #e5e7eb; margin: 2rem 0; }
      ` }} />
    </>
  )
}
