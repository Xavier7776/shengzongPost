'use client'
// components/sections/TrendingCard.tsx
// 浅色风格，与主页面（Blog/Skills）保持一致
// 保留 Top3 领奖台样式 + 4-30 紧凑列表样式 + stars 进度条
import { useScrollReveal } from '@/lib/hooks'
import Card3D from '@/components/ui/Card3D'
import { Star, GitFork, TrendingUp, ExternalLink, Crown, Medal, Award } from 'lucide-react'

interface TrendingItem {
  repo_name: string
  slug: string
  full_name: string
  description: string | null
  html_url: string
  stars: number
  forks: number
  language: string | null
  owner_avatar: string | null
  topics: string[]
  period: string
  stars_gained: number
  rank: number
}

interface TrendingCardProps {
  item: TrendingItem
  index: number
  maxStars: number // 用于计算 stars 进度条比例
}

// 语言颜色（hex 格式，方便内联 style 使用）
const LANGUAGE_COLORS_HEX: Record<string, string> = {
  TypeScript: '#3b82f6',
  JavaScript: '#facc15',
  Python: '#22c55e',
  Rust: '#f97316',
  Go: '#06b6d4',
  Java: '#ef4444',
  'C++': '#ec4899',
  C: '#6b7280',
  Ruby: '#f87171',
  PHP: '#a855f7',
  Swift: '#fb923c',
  Kotlin: '#c084fc',
  Dart: '#22d3ee',
  Scala: '#dc2626',
  Shell: '#9ca3af',
  HTML: '#fdba74',
  CSS: '#60a5fa',
  Vue: '#34d399',
  Svelte: '#f97316',
}

const FALLING_COLOR = '#94a3b8'

// Top 3 领奖台样式（浅色版）
const PODIUM_STYLES = [
  {
    // 第 1 名 - 金色
    border: 'border-amber-200',
    glow: 'shadow-[0_8px_30px_-8px_rgba(251,191,36,0.25)]',
    bg: 'from-amber-50/80 via-white to-white',
    rankColor: 'text-amber-500',
    barColor: 'from-amber-400 to-yellow-500',
    icon: Crown,
    iconColor: 'text-amber-500',
    label: '冠军',
    nameHover: 'group-hover:text-amber-600',
  },
  {
    // 第 2 名 - 银色
    border: 'border-slate-200',
    glow: 'shadow-[0_8px_24px_-10px_rgba(148,163,184,0.2)]',
    bg: 'from-slate-50/80 via-white to-white',
    rankColor: 'text-slate-400',
    barColor: 'from-slate-300 to-slate-400',
    icon: Medal,
    iconColor: 'text-slate-400',
    label: '亚军',
    nameHover: 'group-hover:text-slate-600',
  },
  {
    // 第 3 名 - 铜色
    border: 'border-orange-200',
    glow: 'shadow-[0_8px_24px_-10px_rgba(251,146,60,0.2)]',
    bg: 'from-orange-50/80 via-white to-white',
    rankColor: 'text-orange-500',
    barColor: 'from-orange-400 to-orange-500',
    icon: Award,
    iconColor: 'text-orange-500',
    label: '季军',
    nameHover: 'group-hover:text-orange-600',
  },
]

function formatStars(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return n.toLocaleString()
}

export default function TrendingCard({ item, index, maxStars }: TrendingCardProps) {
  const [ref, isVisible] = useScrollReveal()
  const isTop3 = item.rank <= 3
  const podium = isTop3 ? PODIUM_STYLES[item.rank - 1] : null
  const langColor = LANGUAGE_COLORS_HEX[item.language || ''] || FALLING_COLOR
  const isGrowth = item.period === 'growth' && item.stars_gained > 0
  const starsPercent = maxStars > 0 ? Math.max(2, (item.stars / maxStars) * 100) : 0

  // ─── Top 3 领奖台样式（大卡片，带 3D 效果） ──────────────────
  if (podium) {
    const PodiumIcon = podium.icon
    return (
      <div
        ref={ref}
        className={`transition-all duration-700 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
        style={{ transitionDelay: `${index * 60}ms` }}
      >
        <Card3D className="h-full">
          <a
            href={item.html_url}
            target="_blank"
            rel="noopener noreferrer"
            className="group block h-full"
          >
            <article
              className={`relative overflow-hidden rounded-2xl border ${podium.border} ${podium.glow} bg-gradient-to-br ${podium.bg} p-6 h-full flex flex-col`}
            >
              {/* 顶部：排名 + 奖牌图标 */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex flex-col items-center">
                    <PodiumIcon className={`w-6 h-6 ${podium.iconColor} mb-1`} />
                    <span className={`text-3xl font-black tabular-nums ${podium.rankColor}`}>
                      {String(item.rank).padStart(2, '0')}
                    </span>
                  </div>
                  <div className="h-12 w-px bg-gray-200" />
                  <div className="flex items-center gap-2">
                    {item.owner_avatar && (
                      <img
                        src={item.owner_avatar}
                        alt={item.full_name}
                        className="w-9 h-9 rounded-full border border-gray-100"
                      />
                    )}
                    <div>
                      <div className="text-[10px] text-gray-400 font-mono">{podium.label}</div>
                      <div className="text-[10px] text-gray-400">
                        {item.full_name.split('/')[0]}
                      </div>
                    </div>
                  </div>
                </div>
                {isGrowth && (
                  <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-1 rounded-lg">
                    <TrendingUp className="w-3 h-3" />
                    +{formatStars(item.stars_gained)}
                  </span>
                )}
              </div>

              {/* 仓库名 */}
              <h3 className={`text-lg font-black text-gray-900 mb-2 leading-snug transition-colors ${podium.nameHover}`}>
                {item.full_name.split('/')[1] || item.full_name}
              </h3>

              {/* 描述 */}
              <p className="text-sm text-gray-500 leading-relaxed mb-4 flex-1 line-clamp-2">
                {item.description || 'No description'}
              </p>

              {/* Stars 进度条 */}
              <div className="mb-3">
                <div className="flex items-center justify-between text-[10px] text-gray-400 font-mono mb-1.5">
                  <span>STARS</span>
                  <span className="text-amber-500 font-bold">{formatStars(item.stars)}</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full bg-gradient-to-r ${podium.barColor} rounded-full transition-all duration-1000`}
                    style={{ width: `${starsPercent}%` }}
                  />
                </div>
              </div>

              {/* 底部：语言 + Forks */}
              <div className="flex items-center gap-3 text-xs text-gray-400 pt-3 border-t border-gray-100">
                {item.language && (
                  <span className="flex items-center gap-1.5">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ background: langColor }}
                    />
                    {item.language}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <GitFork className="w-3 h-3" />
                  {formatStars(item.forks)}
                </span>
                <span className="ml-auto flex items-center gap-1 text-gray-300 group-hover:text-blue-400 transition-colors">
                  <ExternalLink className="w-3 h-3" />
                </span>
              </div>
            </article>
          </a>
        </Card3D>
      </div>
    )
  }

  // ─── 4-30 名紧凑列表样式（浅色） ────────────────────────────
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}
      style={{ transitionDelay: `${index * 30}ms` }}
    >
      <a
        href={item.html_url}
        target="_blank"
        rel="noopener noreferrer"
        className="group block"
      >
        <article className="relative overflow-hidden rounded-xl border border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm transition-all duration-200 p-4">
          <div className="flex items-center gap-4">
            {/* 排名 */}
            <div className="flex-shrink-0 w-10 text-center">
              <div className="text-xl font-black text-gray-300 tabular-nums group-hover:text-gray-500 transition-colors">
                {String(item.rank).padStart(2, '0')}
              </div>
            </div>

            {/* 头像 */}
            {item.owner_avatar && (
              <img
                src={item.owner_avatar}
                alt={item.full_name}
                className="w-8 h-8 rounded-full border border-gray-100 flex-shrink-0"
              />
            )}

            {/* 中间：名称 + 描述 */}
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                {item.full_name}
              </h3>
              <p className="text-xs text-gray-400 leading-relaxed line-clamp-2 mt-0.5">
                {item.description || 'No description'}
              </p>
            </div>

            {/* 右侧：数据 */}
            <div className="flex items-center gap-3 flex-shrink-0">
              {isGrowth && (
                <span className="hidden sm:flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                  <TrendingUp className="w-2.5 h-2.5" />+{formatStars(item.stars_gained)}
                </span>
              )}
              <div className="flex items-center gap-1 text-xs text-amber-500 font-bold tabular-nums">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                {formatStars(item.stars)}
              </div>
              {item.language && (
                <span
                  className="hidden md:block w-2 h-2 rounded-full flex-shrink-0"
                  style={{ background: langColor }}
                  title={item.language}
                />
              )}
            </div>
          </div>

          {/* Topics 标签 */}
          {item.topics && item.topics.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2 ml-14">
              {item.topics.slice(0, 4).map(topic => (
                <span key={topic} className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-gray-50 text-gray-400 border border-gray-100">
                  {topic}
                </span>
              ))}
            </div>
          )}

          {/* Stars 进度条（底部细线） */}
          <div className="mt-3 h-0.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-400 to-violet-400 rounded-full transition-all duration-1000"
              style={{ width: `${starsPercent}%` }}
            />
          </div>
        </article>
      </a>
    </div>
  )
}
