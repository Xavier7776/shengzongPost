'use client'

import UserMenu from '@/components/layout/UserMenu'
import { ChevronDown, Plus, Bell, Coins } from 'lucide-react'
import type { ResearchState } from '../useResearch'
import { FLOW_NODES } from '@/features/research/lib/research'

type Props = Pick<ResearchState,
  | 'setIsProjectDropdownOpen'
  | 'isProjectDropdownOpen'
  | 'fetchHistoryReports'
  | 'selectedProject'
  | 'historyReports'
  | 'setActiveMenu'
  | 'setRunStage'
  | 'setCurrentNodeIdx'
  | 'setReportContent'
  | 'reportContentRef'
  | 'nodeStartTimesRef'
  | 'setPlanContent'
  | 'setLogs'
  | 'setErrorMsg'
  | 'setHumanFeedbackPrompt'
  | 'setHumanFeedbackInput'
  | 'stopTimer'
  | 'setElapsedTime'
  | 'setTaskTopic'
  | 'setSelectedModel'
  | 'setSelectedLanguage'
  | 'setSelectedProject'
  | 'addLog'
  | 'points'
  | 'setIsNotifyOpen'
  | 'isNotifyOpen'
  | 'logs'
>

export default function ResearchToolbar({
  setIsProjectDropdownOpen, isProjectDropdownOpen, fetchHistoryReports, selectedProject,
  historyReports, setActiveMenu, setRunStage, setCurrentNodeIdx, setReportContent, reportContentRef,
  nodeStartTimesRef, setPlanContent, setLogs, setErrorMsg, setHumanFeedbackPrompt,
  setHumanFeedbackInput, stopTimer, setElapsedTime, setTaskTopic, setSelectedModel,
  setSelectedLanguage, setSelectedProject, addLog, points, setIsNotifyOpen, isNotifyOpen, logs,
}: Props) {
  return (
    <div className="bg-white border-b border-gray-100 px-6 py-3 flex items-center justify-between shrink-0 flex-wrap gap-3">
      <div className="flex items-center gap-3">
        <span className="text-xs text-gray-400">快捷:</span>
        <div className="relative">
          <button
            onClick={() => {
              setIsProjectDropdownOpen(!isProjectDropdownOpen)
              if (!isProjectDropdownOpen) fetchHistoryReports()
            }}
            className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-200 hover:border-gray-300 rounded-lg text-xs font-medium text-gray-700 transition-all"
          >
            <span>{selectedProject}</span>
            <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
          </button>
          {isProjectDropdownOpen && (
            <div className="absolute left-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50 max-h-96 overflow-y-auto">
              <div className="px-4 py-2 text-[10px] font-bold text-gray-400 uppercase border-b border-gray-50">
                历史研报快速回忆
              </div>
              {historyReports.length === 0 ? (
                <div className="px-4 py-6 text-center text-xs text-gray-400">
                  暂无历史研报<br />
                  <button
                    onClick={() => { setActiveMenu('配置中心'); setIsProjectDropdownOpen(false) }}
                    className="text-blue-500 hover:underline mt-1"
                  >
                    去创建第一份研报
                  </button>
                </div>
              ) : (
                historyReports.slice(0, 10).map(report => (
                  <button
                    key={report.id}
                    onClick={async () => {
                      // 重置工作台状态
                      setRunStage('idle')
                      setCurrentNodeIdx(-1)
                      setReportContent('')
                      reportContentRef.current = ''
                      nodeStartTimesRef.current = {}
                      setPlanContent('')
                      setLogs([])
                      setErrorMsg('')
                      setHumanFeedbackPrompt('')
                      setHumanFeedbackInput('')
                      stopTimer()
                      setElapsedTime(0)

                      // 加载历史研报配置
                      setTaskTopic(report.topic)
                      setSelectedModel(report.model)
                      setSelectedLanguage(report.language)
                      setSelectedProject(report.topic.slice(0, 20) + (report.topic.length > 20 ? '...' : ''))
                      setIsProjectDropdownOpen(false)

                      // 拉取完整报告内容
                      try {
                        const res = await fetch(`/api/research/reports/${report.id}`, { cache: 'no-store' })
                        if (res.ok) {
                          const data = await res.json()
                          if (data.report) {
                            const content = data.report.report_content || ''
                            reportContentRef.current = content
                            setReportContent(content)
                            setElapsedTime(data.report.elapsed_seconds || 0)
                          }
                        }
                      } catch (err) {
                        console.error('[快捷入口加载报告]', err)
                      }

                      // 跳转到工作台，以完成状态展示报告
                      setRunStage('finished')
                      setCurrentNodeIdx(FLOW_NODES.length)
                      setActiveMenu('工作台')
                      addLog(`已加载历史研报: ${report.topic.slice(0, 30)}...`, 'info')
                    }}
                    className="w-full text-left px-4 py-2.5 hover:bg-blue-50 transition-colors border-b border-gray-50 last:border-0"
                  >
                    <div className="text-xs font-medium text-gray-700 truncate">{report.topic}</div>
                    <div className="flex items-center gap-2 mt-1 text-[9px] text-gray-400">
                      <span>{report.language}</span>
                      <span className="font-mono">{report.model}</span>
                      <span>{new Date(report.created_at).toLocaleDateString('zh-CN')}</span>
                    </div>
                  </button>
                ))
              )}
              <div className="px-4 py-2 border-t border-gray-50">
                <button
                  onClick={() => { setActiveMenu('历史研报'); setIsProjectDropdownOpen(false) }}
                  className="w-full text-center text-[10px] text-blue-500 hover:underline py-1"
                >
                  查看全部历史研报 →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3">
        {/* 积分快捷显示 */}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg">
          <Coins className="w-3.5 h-3.5 text-amber-500" />
          <span className="text-xs font-bold text-amber-700">
            {points === null ? '—' : points.toLocaleString()}
          </span>
        </div>
        <button
          onClick={() => {
            setActiveMenu('配置中心')
            setRunStage('idle')
            setErrorMsg('')
            setReportContent('')
            setLogs([])
            setCurrentNodeIdx(-1)
            setSelectedProject('新建研报')
          }}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-xs font-medium transition-all shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          新建研报
        </button>
        <div className="w-px h-5 bg-gray-200" />
        {/* 通知下拉 */}
        <div className="relative">
          <button
            onClick={() => setIsNotifyOpen(!isNotifyOpen)}
            className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-50 relative"
          >
            <Bell className="w-4 h-4" />
            {logs.some(l => l.type === 'error') && (
              <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full" />
            )}
          </button>
          {isNotifyOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50">
              <div className="px-4 py-2 text-[10px] font-bold text-gray-400 uppercase border-b border-gray-50">
                系统通知
              </div>
              {logs.length === 0 ? (
                <div className="px-4 py-6 text-center text-xs text-gray-400">暂无通知</div>
              ) : (
                logs.slice(0, 5).map((log, idx) => (
                  <div key={idx} className="px-4 py-2.5 border-b border-gray-50 last:border-0">
                    <div className="flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        log.type === 'error' ? 'bg-red-500'
                        : log.type === 'success' ? 'bg-green-500'
                        : log.type === 'system' ? 'bg-blue-500'
                        : log.type === 'warn' ? 'bg-amber-500'
                        : 'bg-purple-500'
                      }`} />
                      <span className="text-[10px] text-gray-400 font-mono">{log.time}</span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1 truncate">{log.text}</p>
                  </div>
                ))
              )}
              <div className="px-4 py-2 border-t border-gray-50">
                <button
                  onClick={() => { setActiveMenu('运行日志'); setIsNotifyOpen(false) }}
                  className="w-full text-center text-[10px] text-blue-500 hover:underline py-1"
                >
                  查看全部日志 →
                </button>
              </div>
            </div>
          )}
        </div>
        {/* 用户头像菜单（复用博客 Navbar 的 UserMenu 组件） */}
        <div className="w-px h-5 bg-gray-200" />
        <UserMenu />
      </div>
    </div>
  )
}
