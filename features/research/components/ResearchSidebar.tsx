'use client'

import Link from 'next/link'
import { LayoutDashboard, Sliders, ListTodo, FileText, Settings, ArrowRight, Microscope, Coins, RefreshCw } from 'lucide-react'
import type { ResearchState } from '../useResearch'
import { FLOW_NODES, RESEARCH_COST } from '@/features/research/lib/research'

type Props = Pick<ResearchState,
  | 'activeMenu'
  | 'setActiveMenu'
  | 'isRunning'
  | 'isFinished'
  | 'currentNodeIdx'
  | 'fetchPoints'
  | 'pointsLoading'
  | 'canUsePoints'
  | 'points'
  | 'session'
>

export default function ResearchSidebar({
  activeMenu, setActiveMenu, isRunning, isFinished, currentNodeIdx, fetchPoints, pointsLoading,
  canUsePoints, points, session,
}: Props) {
  return (
    <aside className="w-full lg:w-64 bg-white border-r border-gray-100 flex flex-col justify-between shrink-0">
      <div>
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-gray-50 gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white shadow-sm">
            <Microscope className="w-4 h-4" />
          </div>
          <span className="font-bold text-base text-gray-800">深度研究</span>
        </div>

        <nav className="mt-5 px-3 space-y-1">
          {[
            { id: '工作台' as const, label: '工作台', icon: LayoutDashboard },
            { id: '配置中心' as const, label: '配置中心', icon: Sliders },
            { id: '历史研报' as const, label: '历史研报', icon: ListTodo },
            { id: '运行日志' as const, label: '运行日志', icon: FileText },
            { id: '设置' as const, label: '设置', icon: Settings },
          ].map(item => {
            const Icon = item.icon
            const isActive = activeMenu === item.id
            return (
              <button
                key={item.id}
                onClick={() => setActiveMenu(item.id)}
                className={`w-full flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
                }`}
              >
                <Icon className={`w-4 h-4 mr-3 ${isActive ? 'text-blue-500' : 'text-gray-400'}`} />
                {item.label}
              </button>
            )
          })}
        </nav>

        {/* 返回 Trending */}
        <div className="mt-6 px-3">
          <Link
            href="/skills"
            className="w-full flex items-center px-4 py-2.5 rounded-xl text-xs font-medium text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-all"
          >
            <ArrowRight className="w-3.5 h-3.5 mr-2 rotate-180" />
            返回 Trending
          </Link>
        </div>
      </div>

      {/* 系统状态卡片 */}
      <div className="p-4 border-t border-gray-50">
        <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">系统状态</span>
            <div className="flex items-center">
              <span className={`w-2 h-2 rounded-full mr-1.5 ${isRunning ? 'bg-blue-500 animate-pulse' : 'bg-green-500'}`} />
              <span className={`text-[10px] font-medium ${isRunning ? 'text-blue-600' : 'text-green-600'}`}>
                {isRunning ? '运行中' : '就绪'}
              </span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-y-2 text-[10px]">
            <div>
              <span className="text-gray-400 block">Agent 总数</span>
              <span className="font-bold text-gray-800 text-sm">6</span>
            </div>
            <div>
              <span className="text-gray-400 block">已完成</span>
              <span className="font-bold text-gray-800 text-sm">
                {isFinished ? FLOW_NODES.length : Math.max(0, currentNodeIdx)}
              </span>
            </div>
          </div>
          <div className="w-full bg-gray-200 h-1 rounded-full overflow-hidden mt-2">
            <div
              className="bg-blue-500 h-1 rounded-full transition-all duration-500"
              style={{ width: `${isFinished ? 100 : (currentNodeIdx >= 0 ? (currentNodeIdx / FLOW_NODES.length) * 100 : 0)}%` }}
            />
          </div>

          {/* 积分显示 */}
          <div className="mt-3 pt-3 border-t border-gray-100">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                <Coins className="w-3 h-3" /> 积分余额
              </span>
              <button
                onClick={fetchPoints}
                disabled={pointsLoading}
                className="text-[10px] text-gray-400 hover:text-blue-500 transition-colors"
                title="刷新"
              >
                <RefreshCw className={`w-3 h-3 ${pointsLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className={`font-bold text-sm ${canUsePoints ? 'text-gray-800' : 'text-red-500'}`}>
                {points === null ? '—' : points.toLocaleString()}
              </span>
              <span className="text-[9px] text-gray-400">/ {RESEARCH_COST} 每次研究</span>
            </div>
            {!session?.user && (
              <p className="text-[9px] text-amber-500 mt-1">请先登录</p>
            )}
            {session?.user && !canUsePoints && points !== null && (
              <p className="text-[9px] text-red-500 mt-1">积分不足</p>
            )}
          </div>
        </div>
      </div>
    </aside>
  )
}
