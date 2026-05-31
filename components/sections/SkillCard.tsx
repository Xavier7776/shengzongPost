'use client'
// components/sections/SkillCard.tsx
import Link from 'next/link'
import { useScrollReveal } from '@/lib/hooks'
import Card3D from '@/components/ui/Card3D'
import { Star, Clock, Github, Globe } from 'lucide-react'

interface SkillMeta {
  slug: string
  name: string
  description: string | null
  chinese_summary: string | null
  source_type: string
  stars: number
  tags: string[]
  category: string
  created_at: string
  updated_at: string
}

interface SkillCardProps {
  skill: SkillMeta
  index: number
}

// 判断是否是新技能（7天内创建）
function isNew(created_at: string): boolean {
  const created = new Date(created_at)
  const now = new Date()
  const diffDays = (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)
  return diffDays <= 3
}

const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  coding:       { bg: 'bg-blue-50',   text: 'text-blue-600' },
  research:     { bg: 'bg-violet-50', text: 'text-violet-600' },
  creative:     { bg: 'bg-pink-50',   text: 'text-pink-600' },
  automation:   { bg: 'bg-amber-50',  text: 'text-amber-600' },
  productivity: { bg: 'bg-emerald-50', text: 'text-emerald-600' },
  other:        { bg: 'bg-gray-50',   text: 'text-gray-500' },
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

export default function SkillCard({ skill, index }: SkillCardProps) {
  const [ref, isVisible] = useScrollReveal()
  const cat = CATEGORY_COLORS[skill.category] ?? CATEGORY_COLORS.other
  const catLabel = CATEGORY_LABELS[skill.category] ?? 'AI 工具'
  const SourceIcon = SOURCE_ICON[skill.source_type] ?? Globe

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`}
      style={{ transitionDelay: `${index * 80}ms` }}
    >
      <Card3D className="h-full">
        <Link href={`/skills/${skill.slug}`} className="group block h-full">
          <article className="flex flex-col h-full bg-white rounded-2xl overflow-hidden border border-gray-100/80 shadow-sm p-6 min-h-[320px]">

            {/* 顶部：分类 + Stars + NEW 标记 */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-black tracking-widest uppercase ${cat.bg} ${cat.text} px-2.5 py-1 rounded-lg`}>
                  {catLabel}
                </span>
                {isNew(skill.created_at) && (
                  <span className="bg-gradient-to-r from-orange-400 to-amber-400 text-white text-[9px] font-extrabold tracking-wider px-2 py-0.5 rounded-full shadow-md shadow-orange-200/50 animate-bounce">NEW

                  </span>
                )}
              </div>
              <span className="flex items-center gap-1 text-xs text-amber-500 font-bold">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                {skill.stars.toLocaleString()}
              </span>
            </div>

            {/* 名称 */}
            <h3 className="text-lg font-black text-gray-900 mb-3 leading-snug group-hover:text-blue-600 transition-colors">
              {skill.name}
            </h3>

            {/* 中文简介 - 显示更多内容 */}
            <p className="text-sm text-gray-600 leading-relaxed mb-4 flex-1 line-clamp-5">
              {skill.chinese_summary ?? skill.description ?? '暂无简介'}
            </p>

            {/* 标签 - 2列布局 */}
            {skill.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-4">
                {skill.tags.slice(0, 4).map(t => (
                  <span
                    key={t}
                    className="text-[10px] uppercase tracking-widest font-bold bg-gray-50 text-gray-500 px-2 py-0.5 rounded-md border border-gray-100"
                  >
                    {t}
                  </span>
                ))}
                {skill.tags.length > 4 && (
                  <span className="text-[10px] text-gray-400 px-1">+{skill.tags.length - 4}</span>
                )}
              </div>
            )}

            {/* 底部元信息 */}
            <div className="flex items-center gap-3 text-xs text-gray-400 pt-3 border-t border-gray-50 mt-auto">
              <span className="flex items-center gap-1">
                <SourceIcon className="w-3 h-3" />
                {skill.source_type}
              </span>
              <span className="flex items-center gap-1 ml-auto">
                <Clock className="w-3 h-3" />
                {formatDate(skill.updated_at)}
              </span>
              <span className="text-gray-300 group-hover:text-blue-400 transition-colors text-base leading-none">↗</span>
            </div>

          </article>
        </Link>
      </Card3D>
    </div>
  )
}
