'use client'
// components/sections/TrendingCard.tsx
import { useScrollReveal } from '@/lib/hooks'
import Card3D from '@/components/ui/Card3D'
import { Star, GitFork, TrendingUp, ExternalLink } from 'lucide-react'

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
}

const LANGUAGE_COLORS: Record<string, string> = {
  TypeScript: 'bg-blue-500',
  JavaScript: 'bg-yellow-400',
  Python: 'bg-green-500',
  Rust: 'bg-orange-500',
  Go: 'bg-cyan-500',
  Java: 'bg-red-500',
  'C++': 'bg-pink-500',
  C: 'bg-gray-500',
  Ruby: 'bg-red-400',
  PHP: 'bg-purple-500',
  Swift: 'bg-orange-400',
  Kotlin: 'bg-purple-400',
  Dart: 'bg-cyan-400',
  Scala: 'bg-red-600',
  Shell: 'bg-gray-400',
  HTML: 'bg-orange-300',
  CSS: 'bg-blue-400',
  Vue: 'bg-emerald-400',
  Svelte: 'bg-orange-500',
}

function formatStars(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return n.toLocaleString()
}

export default function TrendingCard({ item, index }: TrendingCardProps) {
  const [ref, isVisible] = useScrollReveal()

  const langColor = LANGUAGE_COLORS[item.language || ''] || 'bg-gray-400'
  const isGrowth = item.period === 'growth' && item.stars_gained > 0

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`}
      style={{ transitionDelay: `${index * 80}ms` }}
    >
      <Card3D className="h-full">
        <a
          href={item.html_url}
          target="_blank"
          rel="noopener noreferrer"
          className="group block h-full"
        >
          <article className="flex flex-col h-full bg-white rounded-2xl overflow-hidden border border-gray-100/80 shadow-sm p-6 min-h-[200px]">

            {/* 顶部：排名 + Star 数 */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl font-black text-gray-200 tabular-nums">
                  {String(item.rank).padStart(2, '0')}
                </span>
                {item.owner_avatar && (
                  <img
                    src={item.owner_avatar}
                    alt={item.full_name}
                    className="w-8 h-8 rounded-full border border-gray-100"
                  />
                )}
              </div>
              <div className="flex items-center gap-3">
                {isGrowth && (
                  <span className="flex items-center gap-1 text-xs font-bold text-emerald-500 bg-emerald-50 px-2 py-1 rounded-lg">
                    <TrendingUp className="w-3 h-3" />
                    +{formatStars(item.stars_gained)}
                  </span>
                )}
                <span className="flex items-center gap-1 text-xs text-amber-500 font-bold">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  {formatStars(item.stars)}
                </span>
              </div>
            </div>

            {/* 名称 */}
            <h3 className="text-base font-bold text-gray-900 mb-2 leading-snug group-hover:text-blue-600 transition-colors">
              {item.full_name}
            </h3>

            {/* 描述 */}
            <p className="text-sm text-gray-500 leading-relaxed mb-4 flex-1 line-clamp-2">
              {item.description || 'No description'}
            </p>

            {/* 底部：语言 + Forks + 链接 */}
            <div className="flex items-center gap-3 text-xs text-gray-400 pt-3 border-t border-gray-50 mt-auto">
              {item.language && (
                <span className="flex items-center gap-1.5">
                  <span className={`w-2.5 h-2.5 rounded-full ${langColor}`} />
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
