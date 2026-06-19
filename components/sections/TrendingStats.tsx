'use client'
// components/sections/TrendingStats.tsx
// Trending 数据概览面板：KPI + 语言分布环形图 + Top10 Stars 柱状图
// 浅色风格，与主页面（Blog/Skills）保持一致
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { Star, GitFork, Code2, Trophy } from 'lucide-react'

interface TrendingItem {
  repo_name: string
  full_name: string
  stars: number
  forks: number
  language: string | null
  stars_gained: number
  rank: number
}

interface TrendingStatsProps {
  items: TrendingItem[]
  period: 'daily' | 'weekly' | 'growth'
}

// 语言颜色（hex 格式，方便 recharts 使用）
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

function formatStars(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return n.toLocaleString()
}

const PERIOD_LABELS: Record<string, string> = {
  daily: '每日热门',
  weekly: '每周热门',
  growth: 'Star 增速',
}

export default function TrendingStats({ items, period }: TrendingStatsProps) {
  // KPI 计算
  const totalStars = items.reduce((sum, i) => sum + i.stars, 0)
  const totalForks = items.reduce((sum, i) => sum + i.forks, 0)
  const languages = new Set(items.filter(i => i.language).map(i => i.language!))
  const totalGained = items.reduce((sum, i) => sum + (i.stars_gained || 0), 0)

  // 语言分布数据
  const langMap = new Map<string, number>()
  for (const item of items) {
    if (item.language) {
      langMap.set(item.language, (langMap.get(item.language) || 0) + 1)
    }
  }
  const langData = Array.from(langMap.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8)

  // Top 10 Stars 数据
  const top10Data = items
    .slice(0, 10)
    .map(i => ({
      name: i.full_name.split('/')[1] || i.full_name,
      stars: i.stars,
      color: LANGUAGE_COLORS_HEX[i.language || ''] || FALLING_COLOR,
    }))
    .reverse() // 反转让排名第一在最上面

  const kpis = [
    {
      label: '项目总数',
      value: items.length,
      icon: Trophy,
      color: 'text-amber-500',
      bg: 'from-amber-50 to-amber-50/50',
      border: 'border-amber-100',
    },
    {
      label: '总 Stars',
      value: formatStars(totalStars),
      icon: Star,
      color: 'text-blue-600',
      bg: 'from-blue-50 to-blue-50/50',
      border: 'border-blue-100',
    },
    {
      label: '总 Forks',
      value: formatStars(totalForks),
      icon: GitFork,
      color: 'text-emerald-600',
      bg: 'from-emerald-50 to-emerald-50/50',
      border: 'border-emerald-100',
    },
    {
      label: '语言种类',
      value: languages.size,
      icon: Code2,
      color: 'text-violet-600',
      bg: 'from-violet-50 to-violet-50/50',
      border: 'border-violet-100',
    },
  ]

  return (
    <div className="mb-10 space-y-4">
      {/* KPI 卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map(kpi => {
          const Icon = kpi.icon
          return (
            <div
              key={kpi.label}
              className={`relative overflow-hidden rounded-2xl border ${kpi.border} bg-gradient-to-br ${kpi.bg} p-5`}
            >
              <div className="flex items-start justify-between mb-3">
                <span className="text-[10px] font-bold tracking-widest uppercase text-gray-500">
                  {kpi.label}
                </span>
                <Icon className={`w-4 h-4 ${kpi.color}`} />
              </div>
              <div className={`text-2xl font-black tabular-nums ${kpi.color}`}>
                {kpi.value}
              </div>
              {period === 'growth' && kpi.label === '总 Stars' && totalGained > 0 && (
                <div className="text-[10px] text-emerald-600 mt-1 font-mono">
                  +{formatStars(totalGained)} 增量
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* 图表区 */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* 语言分布环形图 */}
        <div className="lg:col-span-2 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-gray-900">语言分布</h3>
            <span className="text-[10px] text-gray-400 font-mono">{PERIOD_LABELS[period]}</span>
          </div>
          {langData.length > 0 ? (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width={140} height={140}>
                <PieChart>
                  <Pie
                    data={langData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={38}
                    outerRadius={65}
                    paddingAngle={2}
                    stroke="none"
                  >
                    {langData.map(entry => (
                      <Cell
                        key={entry.name}
                        fill={LANGUAGE_COLORS_HEX[entry.name] || FALLING_COLOR}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: '#ffffff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '12px',
                      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                    }}
                    labelStyle={{ color: '#374151' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-1.5 min-w-0">
                {langData.map(lang => (
                  <div key={lang.name} className="flex items-center gap-2 text-xs">
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ background: LANGUAGE_COLORS_HEX[lang.name] || FALLING_COLOR }}
                    />
                    <span className="text-gray-700 truncate flex-1">{lang.name}</span>
                    <span className="text-gray-400 font-mono tabular-nums">{lang.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-[140px] flex items-center justify-center text-xs text-gray-400">
              暂无语言数据
            </div>
          )}
        </div>

        {/* Top 10 Stars 柱状图 */}
        <div className="lg:col-span-3 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-gray-900">Top 10 Stars 排行</h3>
            <span className="text-[10px] text-gray-400 font-mono">{PERIOD_LABELS[period]}</span>
          </div>
          {top10Data.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart
                data={top10Data}
                layout="vertical"
                margin={{ top: 0, right: 12, bottom: 0, left: 0 }}
              >
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={110}
                  tick={{ fill: '#6b7280', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(0,0,0,0.03)' }}
                  contentStyle={{
                    background: '#ffffff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '12px',
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                  }}
                  labelStyle={{ color: '#374151' }}
                  formatter={(value: any) => [`${Number(value).toLocaleString()} ★`, 'Stars']}
                />
                <Bar dataKey="stars" radius={[0, 4, 4, 0]}>
                  {top10Data.map((entry, idx) => (
                    <Cell key={idx} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[240px] flex items-center justify-center text-xs text-gray-400">
              暂无数据
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
