'use client'

import { Check, Clock, Pause, BookOpen, Microscope, AlertCircle } from 'lucide-react'
import type { ResearchState } from '../useResearch'
import { FLOW_NODES, TASK_ROWS } from '@/features/research/lib/research'

type Props = Pick<ResearchState,
  | 'errorMsg'
  | 'isFinished'
  | 'setShowReportModal'
  | 'runStage'
  | 'setActiveMenu'
  | 'isRunning'
  | 'setViewMode'
  | 'viewMode'
  | 'handleCancel'
  | 'currentNodeIdx'
  | 'formatTime'
  | 'elapsedTime'
  | 'getTaskStatus'
  | 'nodeStartTimesRef'
  | 'logs'
  | 'logsEndRef'
>

export default function ResearchWorkspace({
  errorMsg, isFinished, setShowReportModal, runStage, setActiveMenu, isRunning, setViewMode,
  viewMode, handleCancel, currentNodeIdx, formatTime, elapsedTime, getTaskStatus, nodeStartTimesRef,
  logs, logsEndRef,
}: Props) {
  return (
    <div className="flex flex-col xl:flex-row min-h-full">
      <div className="flex-1 p-6 space-y-6 min-w-0">
        {/* 错误提示 */}
        {errorMsg && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-sm text-red-600 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* 完成提示 */}
        {isFinished && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-500 text-white flex items-center justify-center">
                <Check className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-green-900">研报生成完成！</h4>
                <p className="text-xs text-green-700 mt-0.5">多 Agent 协同工作已全部通过检验</p>
              </div>
            </div>
            <button
              onClick={() => setShowReportModal(true)}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1"
            >
              <BookOpen className="w-3.5 h-3.5" />
              查看研报
            </button>
          </div>
        )}

        {/* 空状态 */}
        {runStage === 'idle' && !errorMsg && (
          <div className="bg-white border border-gray-100 rounded-2xl p-12 text-center">
            <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Microscope className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-gray-800 mb-2">多 Agent 协作工作台</h3>
            <p className="text-xs text-gray-400 mb-6 max-w-md mx-auto">
              6 个 AI Agent 将协同完成：浏览采集 → 规划大纲 → 人工审阅 → 深度研究 → 撰写报告 → 发布输出
            </p>
            <button
              onClick={() => setActiveMenu('配置中心')}
              className="px-6 py-2.5 bg-blue-500 hover:bg-blue-600 text-white text-sm font-bold rounded-xl transition-all shadow-sm"
            >
              前往配置中心开始
            </button>
          </div>
        )}

        {/* 流程看板 */}
        {(isRunning || isFinished) && (
          <section className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <div className="flex items-center gap-2.5">
                  <h2 className="text-sm font-bold text-gray-800">多 Agent 协作流程</h2>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium ${
                    isRunning ? 'bg-blue-50 text-blue-600 border border-blue-200' : 'bg-green-50 text-green-600 border border-green-200'
                  }`}>
                    {isRunning ? '运行中' : '已完成'}
                  </span>
                </div>
                <p className="text-[11px] text-gray-400 mt-1">6 个 AI Agent 协同工作</p>
              </div>
              <div className="flex items-center gap-2">
                {/* 视图切换 */}
                <div className="inline-flex rounded-lg border border-gray-200 p-0.5 bg-gray-50">
                  <button
                    onClick={() => setViewMode('visual')}
                    className={`px-3 py-1 text-[11px] font-medium rounded-md transition-all ${
                      viewMode === 'visual' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-400'
                    }`}
                  >
                    可视化
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`px-3 py-1 text-[11px] font-medium rounded-md transition-all ${
                      viewMode === 'list' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-400'
                    }`}
                  >
                    列表
                  </button>
                </div>
                {isRunning && (
                  <button
                    onClick={handleCancel}
                    className="p-1.5 border border-gray-200 rounded-lg text-gray-600 bg-white hover:bg-gray-50"
                    title="取消生成"
                  >
                    <Pause className="w-4 h-4 text-amber-500" />
                  </button>
                )}
              </div>
            </div>

            {viewMode === 'visual' ? (
              <>
                {/* 节点流程 — 响应式网格，无需横向滚动 */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {FLOW_NODES.map((node, index) => {
                    const isCompleted = currentNodeIdx > index || isFinished
                    const isRunningNode = currentNodeIdx === index && !isFinished
                    const isWaiting = !isCompleted && !isRunningNode
                    return (
                      <div
                        key={node.id}
                        className={`relative bg-white border rounded-xl p-4 transition-all duration-300 ${
                          isRunningNode
                            ? 'border-2 border-blue-500 shadow-lg shadow-blue-500/10 scale-[1.02]'
                            : isCompleted
                            ? 'border-green-400 bg-green-50/30'
                            : 'border-gray-200 border-dashed opacity-60'
                        }`}
                      >
                        {/* 步骤编号 */}
                        <div className="absolute top-3 right-3 flex items-center gap-1.5">
                          <span className="text-[9px] font-bold text-gray-300">#{index + 1}</span>
                          {isCompleted && (
                            <div className="w-4 h-4 rounded-full bg-green-500 text-white flex items-center justify-center shadow">
                              <Check className="w-2.5 h-2.5" />
                            </div>
                          )}
                          {isRunningNode && (
                            <div className="w-4 h-4 rounded-full bg-blue-500 animate-ping" />
                          )}
                        </div>
                        {/* 图标 + 名称 */}
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`text-2xl ${isRunningNode ? 'animate-bounce' : ''}`}>{node.icon}</span>
                          <div>
                            <h3 className="text-xs font-bold text-gray-800">{node.name}</h3>
                            <div className="mt-0.5">
                              {isCompleted && <span className="text-[9px] text-green-600 bg-green-50 px-1.5 py-0.5 rounded font-medium">已完成</span>}
                              {isRunningNode && <span className="text-[9px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded font-medium animate-pulse">运行中</span>}
                              {isWaiting && <span className="text-[9px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded font-medium">等待</span>}
                            </div>
                          </div>
                        </div>
                        <p className="text-[10px] text-gray-400 leading-relaxed mb-2">{node.role}</p>
                        <div className="flex items-center gap-1 text-[9px] text-gray-400 border-t border-gray-50 pt-2">
                          <Clock className="w-3 h-3" />
                          <span>{isRunningNode ? formatTime(elapsedTime) : isCompleted ? '已完成' : '—'}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* 计数底栏 */}
                <div className="mt-6 flex items-center gap-6 border-t border-gray-50 pt-4 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-green-500" />
                    <span className="text-gray-500">已完成</span>
                    <span className="font-bold text-gray-800 bg-green-50 px-1.5 rounded">
                      {isFinished ? FLOW_NODES.length : Math.max(0, currentNodeIdx)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    <span className="text-gray-500">运行中</span>
                    <span className="font-bold text-gray-800 bg-blue-50 px-1.5 rounded">{isRunning ? 1 : 0}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-gray-300" />
                    <span className="text-gray-500">等待中</span>
                    <span className="font-bold text-gray-800 bg-gray-100 px-1.5 rounded">
                      {isFinished ? 0 : FLOW_NODES.length - Math.max(0, currentNodeIdx) - (isRunning ? 1 : 0)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 ml-auto">
                    <Clock className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-gray-500">总用时</span>
                    <span className="font-bold text-gray-800 font-mono">{formatTime(elapsedTime)}</span>
                  </div>
                </div>
              </>
            ) : (
              /* 列表视图 */
              <div className="divide-y divide-gray-100 py-3 text-xs">
                {FLOW_NODES.map((node, idx) => {
                  const status = getTaskStatus(idx + 1)
                  return (
                    <div key={node.id} className="py-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{node.icon}</span>
                        <div>
                          <span className="font-medium text-gray-700 block">{node.name}</span>
                          <span className="text-[10px] text-gray-400">{node.role}</span>
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                        status === 'completed' ? 'bg-green-50 text-green-600'
                        : status === 'running' ? 'bg-blue-50 text-blue-600 animate-pulse'
                        : 'bg-gray-100 text-gray-400'
                      }`}>
                        {status === 'completed' ? '已完成' : status === 'running' ? '运行中' : '等待中'}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </section>
        )}

        {/* 任务进度表格 */}
        {(isRunning || isFinished) && (
          <section className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-gray-800">任务进度</h2>
              <span className="text-[10px] text-gray-400">共 {TASK_ROWS.length} 个任务</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 text-gray-400 font-semibold">
                    <th className="pb-3 pr-4">任务名称</th>
                    <th className="pb-3 pr-4">负责 Agent</th>
                    <th className="pb-3 pr-4">状态</th>
                    <th className="pb-3 pr-4">进度</th>
                    <th className="pb-3 pr-4">耗时</th>
                    <th className="pb-3 text-right">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {TASK_ROWS.map(task => {
                    const status = getTaskStatus(task.id)
                    // 动态进度：基于节点已运行时间计算，而非硬编码
                    const taskNodeIdx = task.id - 1
                    let progress = 0
                    if (status === 'completed') {
                      progress = 100
                    } else if (status === 'running') {
                      // 运行中的任务：从当前节点的 baseProgress 逐渐增长到下一节点的 baseProgress
                      const baseProgress = (taskNodeIdx / TASK_ROWS.length) * 100
                      const nextBaseProgress = ((taskNodeIdx + 1) / TASK_ROWS.length) * 100
                      const nodeName = FLOW_NODES[taskNodeIdx].id
                      const startTime = nodeStartTimesRef.current[nodeName]
                      if (startTime) {
                        // 该节点已运行秒数
                        const nodeElapsed = Math.floor((Date.now() - startTime) / 1000)
                        // 每个节点预期 90 秒完成，进度从 baseProgress 增长到 nextBaseProgress - 3
                        const expectedDuration = 90
                        const ratio = Math.min(nodeElapsed / expectedDuration, 1)
                        progress = Math.min(Math.round(baseProgress + (nextBaseProgress - baseProgress - 3) * ratio), 95)
                      } else {
                        // 没有记录开始时间，使用默认值
                        progress = Math.min(Math.round(baseProgress + (100 / TASK_ROWS.length) * 0.3), 95)
                      }
                    }
                    return (
                      <tr key={task.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="py-3 pr-4 font-medium text-gray-800">{task.name}</td>
                        <td className="py-3 pr-4 text-gray-600">
                          <span className="px-2 py-0.5 bg-gray-100 rounded text-[10px]">{task.agent}</span>
                        </td>
                        <td className="py-3 pr-4">
                          {status === 'completed' && <span className="text-green-600 bg-green-50 px-1.5 py-0.5 rounded font-medium">已完成</span>}
                          {status === 'running' && <span className="text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded font-medium animate-pulse">运行中</span>}
                          {status === 'waiting' && <span className="text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded font-medium">等待中</span>}
                        </td>
                        <td className="py-3 pr-4">
                          <div className="flex items-center gap-2">
                            <div className="w-20 bg-gray-100 h-1.5 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${
                                  status === 'completed' ? 'bg-green-500'
                                  : status === 'running' ? 'bg-blue-500'
                                  : 'bg-gray-200'
                                }`}
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                            <span className="font-semibold text-gray-500 w-8">{progress}%</span>
                          </div>
                        </td>
                        <td className="py-3 pr-4 text-gray-400">
                          {status === 'running' ? formatTime(elapsedTime) : status === 'completed' ? '已完成' : '—'}
                        </td>
                        <td className="py-3 text-right">
                          <button
                            onClick={() => isFinished && setShowReportModal(true)}
                            className={`text-blue-500 font-semibold hover:underline text-[11px] ${
                              isFinished ? '' : 'opacity-50 cursor-not-allowed'
                            }`}
                          >
                            查看
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>

      {/* 右侧实时日志 */}
      {(isRunning || isFinished || logs.length > 0) && (
        <aside className="w-full xl:w-80 border-t xl:border-t-0 xl:border-l border-gray-100 bg-white p-6 shrink-0 flex flex-col">
          <div className="flex items-center justify-between border-b border-gray-50 pb-2 mb-3">
            <h2 className="text-sm font-bold text-gray-800">实时日志</h2>
            <span className="text-[10px] text-gray-400">{logs.length} 条</span>
          </div>
          <div className="flex-1 overflow-y-auto space-y-2.5 max-h-[500px]">
            {logs.length === 0 ? (
              <p className="text-xs text-gray-300 text-center py-8">等待日志...</p>
            ) : (
              logs.map((log, idx) => (
                <div key={idx} className="flex gap-2 text-[11px] items-start leading-relaxed">
                  <span className="text-gray-400 font-mono shrink-0">{log.time}</span>
                  <span className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${
                    log.type === 'success' ? 'bg-green-500'
                    : log.type === 'error' ? 'bg-red-500'
                    : log.type === 'system' ? 'bg-blue-500'
                    : log.type === 'warn' ? 'bg-amber-500'
                    : 'bg-purple-500'
                  }`} />
                  <div className="min-w-0">
                    <span className="text-gray-700 font-semibold mr-1">{log.agent}:</span>
                    <span className={`break-words ${
                      log.type === 'error' ? 'text-red-500'
                      : log.type === 'success' ? 'text-green-600'
                      : 'text-gray-500'
                    }`}>{log.text}</span>
                  </div>
                </div>
              ))
            )}
            <div ref={logsEndRef} />
          </div>
        </aside>
      )}
    </div>
  )
}
