// app/admin/analytics/page.tsx
// 访客监控仪表盘：服务端组件，查询初始统计数据后交给客户端渲染图表
import { requireAdmin } from '@/lib/auth'
import {
  getVisitorStats, getVisitorDailyTrend, getTopPages, getTopReferrers, type VisitorRange,
} from '@/lib/db'
import AnalyticsDashboard from './AnalyticsDashboard'

export default async function AdminAnalyticsPage() {
  await requireAdmin()

  // 默认显示近 7 天数据
  const range: VisitorRange = '7d'
  const [stats, dailyTrend, topPages, topReferrers] = await Promise.all([
    getVisitorStats(range),
    getVisitorDailyTrend(range),
    getTopPages(range, 10),
    getTopReferrers(range, 10),
  ])

  return (
    <AnalyticsDashboard
      initialData={{ range, stats, dailyTrend, topPages, topReferrers }}
    />
  )
}
