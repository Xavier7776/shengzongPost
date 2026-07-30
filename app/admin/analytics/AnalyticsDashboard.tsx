'use client'

// app/admin/analytics/AnalyticsDashboard.tsx
// 访客监控仪表盘客户端组件：用 recharts 绘制图表，支持时间范围切换
import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Loader2, BarChart3, Activity, Users, Eye, TrendingUp, RefreshCw } from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, BarChart, Bar,
} from 'recharts'
import type {
  VisitorStats, DailyTrendItem, TopPageItem, TopReferrerItem, VisitorRange,
} from '@/lib/db'

interface AnalyticsData {
  range: VisitorRange
  stats: VisitorStats
  dailyTrend: DailyTrendItem[]
  topPages: TopPageItem[]
  topReferrers: TopReferrerItem[]
}

const RANGE_OPTIONS: { value: VisitorRange; label: string }[] = [
  { value: '7d', label: '近 7 天' },
  { value: '30d', label: '近 30 天' },
  { value: '90d', label: '近 90 天' },
  { value: 'all', label: '全部' },
]

// 数字千分位格式化
function fmtNum(n: number): string {
  return n.toLocaleString('zh-CN')
}

// 统计卡片
function StatCard({
  icon: Icon, label, value, sub, accent,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  sub?: string
  accent: 'blue' | 'green' | 'amber' | 'purple'
}) {
  const colorMap: Record<string, string> = {
    blue: 'text-blue-600 bg-blue-50',
    green: 'text-green-600 bg-green-50',
    amber: 'text-amber-600 bg-amber-50',
    purple: 'text-purple-600 bg-purple-50',
  }
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{label}</span>
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${colorMap[accent]}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <p className="mt-3 text-2xl font-black tracking-tight text-gray-900">{value}</p>
      {sub && <p className="mt-1 text-xs text-gray-400">{sub}</p>}
    </div>
  )
}

export default function AnalyticsDashboard({ initialData }: { initialData: AnalyticsData }) {
  const [data, setData] = useState<AnalyticsData>(initialData)
  const [range, setRange] = useState<VisitorRange>(initialData.range)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function fetchRange(r: VisitorRange) {
    setRange(r)
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/analytics/stats?range=${r}`)
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d?.error || `HTTP ${res.status}`)
      }
      const json = (await res.json()) as AnalyticsData
      setData(json)
    } catch (err) {
      setError(String(err instanceof Error ? err.message : err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-8 py-5 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <Link href="/admin" className="text-gray-400 hover:text-gray-700 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-black tracking-tighter text-gray-900">
              ARC<span className="text-blue-600">.</span> 数据分析
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">访客监控仪表盘</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {RANGE_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => fetchRange(opt.value)}
              disabled={loading || range === opt.value}
              className={`text-xs font-bold px-3.5 py-2 rounded-xl transition-colors disabled:opacity-50 ${
                range === opt.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              {opt.label}
            </button>
          ))}
          <button
            onClick={() => fetchRange(range)}
            disabled={loading}
            title="刷新"
            className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-500 transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-8 py-8 space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm font-bold rounded-xl px-4 py-3">
            加载失败：{error}
          </div>
        )}

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={Eye}
            label="总访问量"
            value={fmtNum(data.stats.total_visits)}
            sub={`页面浏览量 ${fmtNum(data.stats.page_views)}`}
            accent="blue"
          />
          <StatCard
            icon={Activity}
            label="今日访问"
            value={fmtNum(data.stats.today_visits)}
            sub="今日 0 点至今"
            accent="amber"
          />
          <StatCard
            icon={Users}
            label="独立访客"
            value={fmtNum(data.stats.unique_visitors)}
            sub="按 visitor_id 去重"
            accent="green"
          />
          <StatCard
            icon={TrendingUp}
            label="平均浏览页数"
            value={fmtNum(data.stats.avg_pages_per_visitor)}
            sub="总访问 / 独立访客"
            accent="purple"
          />
        </div>

        {/* 每日访问趋势折线图 */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-black text-gray-900 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-600" />
              每日访问趋势
            </h2>
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
              {data.dailyTrend.length} 天数据
            </span>
          </div>
          {data.dailyTrend.length === 0 ? (
            <div className="h-[300px] flex items-center justify-center text-gray-300 text-sm">
              暂无数据
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.dailyTrend} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: '#9ca3af' }}
                  tickLine={false}
                  axisLine={{ stroke: '#e5e7eb' }}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#9ca3af' }}
                  tickLine={false}
                  axisLine={{ stroke: '#e5e7eb' }}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    fontSize: 12,
                    borderRadius: 8,
                    border: '1px solid #e5e7eb',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line
                  type="monotone"
                  dataKey="visits"
                  stroke="#2563eb"
                  strokeWidth={2}
                  name="访问量"
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
                <Line
                  type="monotone"
                  dataKey="unique_visitors"
                  stroke="#16a34a"
                  strokeWidth={2}
                  name="独立访客"
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 热门页面柱状图 */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6">
            <h2 className="text-sm font-black text-gray-900 mb-4 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-600" />
              热门页面 Top 10
            </h2>
            {data.topPages.length === 0 ? (
              <div className="h-[300px] flex items-center justify-center text-gray-300 text-sm">
                暂无数据
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={360}>
                <BarChart
                  data={data.topPages}
                  layout="vertical"
                  margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 11, fill: '#9ca3af' }}
                    tickLine={false}
                    axisLine={{ stroke: '#e5e7eb' }}
                    allowDecimals={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="path"
                    tick={{ fontSize: 10, fill: '#6b7280' }}
                    tickLine={false}
                    axisLine={{ stroke: '#e5e7eb' }}
                    width={160}
                  />
                  <Tooltip
                    contentStyle={{
                      fontSize: 12,
                      borderRadius: 8,
                      border: '1px solid #e5e7eb',
                    }}
                    cursor={{ fill: 'rgba(37, 99, 235, 0.05)' }}
                  />
                  <Bar
                    dataKey="visits"
                    fill="#2563eb"
                    name="访问量"
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* 来源分析表格 */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6">
            <h2 className="text-sm font-black text-gray-900 mb-4 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-600" />
              来源分析 Top 10
            </h2>
            {data.topReferrers.length === 0 ? (
              <div className="h-[300px] flex items-center justify-center text-gray-300 text-sm">
                暂无数据
              </div>
            ) : (
              <div className="overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-left text-[10px] font-black uppercase tracking-widest text-gray-400 border-b border-gray-100">
                      <th className="py-2 pr-2 font-black">#</th>
                      <th className="py-2 pr-2 font-black">来源</th>
                      <th className="py-2 font-black text-right">访问量</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.topReferrers.map((r, i) => (
                      <tr
                        key={`${r.referrer}-${i}`}
                        className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                      >
                        <td className="py-2 pr-2 text-gray-400 font-mono">{i + 1}</td>
                        <td className="py-2 pr-2 text-gray-700 truncate max-w-0">
                          <span className="block truncate" title={r.referrer}>
                            {r.referrer}
                          </span>
                        </td>
                        <td className="py-2 text-right font-bold text-gray-900">
                          {fmtNum(r.visits)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* 热门页面表格 */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6">
          <h2 className="text-sm font-black text-gray-900 mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-blue-600" />
            热门页面明细
          </h2>
          {data.topPages.length === 0 ? (
            <div className="h-[100px] flex items-center justify-center text-gray-300 text-sm">
              暂无数据
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left text-[10px] font-black uppercase tracking-widest text-gray-400 border-b border-gray-100">
                    <th className="py-2 pr-2 font-black">#</th>
                    <th className="py-2 pr-2 font-black">路径</th>
                    <th className="py-2 font-black text-right">访问量</th>
                  </tr>
                </thead>
                <tbody>
                  {data.topPages.map((p, i) => (
                    <tr
                      key={`${p.path}-${i}`}
                      className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                    >
                      <td className="py-2 pr-2 text-gray-400 font-mono">{i + 1}</td>
                      <td className="py-2 pr-2">
                        <Link
                          href={p.path}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-700 hover:underline font-mono"
                        >
                          {p.path}
                        </Link>
                      </td>
                      <td className="py-2 text-right font-bold text-gray-900">
                        {fmtNum(p.visits)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
