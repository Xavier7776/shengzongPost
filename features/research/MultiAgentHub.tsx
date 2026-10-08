'use client'

import { useResearch } from './useResearch'
import ResearchSidebar from './components/ResearchSidebar'
import ResearchToolbar from './components/ResearchToolbar'
import ResearchWorkspace from './components/ResearchWorkspace'
import ResearchConfig from './components/ResearchConfig'
import ResearchHistory from './components/ResearchHistory'
import ResearchLogs from './components/ResearchLogs'
import ResearchSettings from './components/ResearchSettings'
import ResearchDialogs from './components/ResearchDialogs'

export default function MultiAgentHub() {
  const research = useResearch()
  const { activeMenu } = research
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#F7F9FC] flex flex-col lg:flex-row">
      {/* ── 左侧导航 ── */}
      <ResearchSidebar {...research} />

      {/* ── 主工作区 ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* 轻量工具栏（非页眉，不 sticky） */}
        <ResearchToolbar {...research} />

        <div className="flex-1 overflow-y-auto">
          {/* ── 工作台视图 ── */}
          {activeMenu === '工作台' && (
            <ResearchWorkspace {...research} />
          )}

          {/* ── 配置中心视图 ── */}
          {activeMenu === '配置中心' && (
            <ResearchConfig {...research} />
          )}

          {/* ── 历史研报视图 ── */}
          {activeMenu === '历史研报' && (
            <ResearchHistory {...research} />
          )}

          {/* ── 运行日志视图 ── */}
          {activeMenu === '运行日志' && (
            <ResearchLogs {...research} />
          )}

          {/* ── 设置视图 ── */}
          {activeMenu === '设置' && (
            <ResearchSettings />
          )}
        </div>
      </div>

      {/* 人工反馈、积分提示与研报预览 */}
      <ResearchDialogs {...research} />
    </div>
  )
}
