'use client'

import { ChevronDown, Check, Coins, AlertCircle, RefreshCw, Globe } from 'lucide-react'
import type { ResearchState } from '../useResearch'
import { MODEL_GROUPS, LANGUAGE_OPTIONS, RESEARCH_COST } from '@/features/research/lib/research'

type Props = Pick<ResearchState,
  | 'canUsePoints'
  | 'points'
  | 'errorMsg'
  | 'taskTopic'
  | 'setTaskTopic'
  | 'selectedModel'
  | 'setSelectedModel'
  | 'setIsModelDropdownOpen'
  | 'isModelDropdownOpen'
  | 'setIsLangDropdownOpen'
  | 'isLangDropdownOpen'
  | 'selectedLanguage'
  | 'setSelectedLanguage'
  | 'setGuidelines'
  | 'maxSections'
  | 'setMaxSections'
  | 'followGuidelines'
  | 'setFollowGuidelines'
  | 'verbose'
  | 'setVerbose'
  | 'humanFeedback'
  | 'setHumanFeedback'
  | 'maxPlanRevisions'
  | 'setMaxPlanRevisions'
  | 'guidelines'
  | 'startGeneration'
  | 'isRunning'
  | 'pointsLoading'
  | 'session'
>

export default function ResearchConfig({
  canUsePoints, points, errorMsg, taskTopic, setTaskTopic, selectedModel, setSelectedModel,
  setIsModelDropdownOpen, isModelDropdownOpen, setIsLangDropdownOpen, isLangDropdownOpen,
  selectedLanguage, setSelectedLanguage, setGuidelines, maxSections, setMaxSections,
  followGuidelines, setFollowGuidelines, verbose, setVerbose, humanFeedback, setHumanFeedback,
  maxPlanRevisions, setMaxPlanRevisions, guidelines, startGeneration, isRunning, pointsLoading,
  session,
}: Props) {
  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="border-b border-gray-100 pb-4">
        <h1 className="text-lg font-bold text-gray-800">新建深度研报</h1>
        <p className="text-xs text-gray-400 mt-1">
          设置研究主题，多 Agent 将自动完成全网采集、大纲规划与报告编写
        </p>
      </div>

      {/* 积分提示条 */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center">
            <Coins className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-amber-900">深度研究服务</h4>
            <p className="text-xs text-amber-700 mt-0.5">每次生成消耗 {RESEARCH_COST} 积分</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-amber-600 uppercase tracking-wider">当前余额</p>
          <p className={`text-lg font-bold ${canUsePoints ? 'text-amber-900' : 'text-red-500'}`}>
            {points === null ? '—' : points.toLocaleString()}
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-sm text-red-600 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-6">
        {/* 研究主题 */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-gray-500">研究主题</label>
          <textarea
            value={taskTopic}
            onChange={e => setTaskTopic(e.target.value)}
            className="w-full text-sm p-4 border border-gray-200 rounded-xl bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            rows={4}
            placeholder="请输入研究主题..."
          />

        </div>

        {/* 模型 + 语言 + 章节数 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="relative">
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">大语言模型</label>
            <div className="relative">
              <input
                type="text"
                value={selectedModel}
                onChange={e => setSelectedModel(e.target.value)}
                className="w-full text-sm p-3 pr-10 border border-gray-200 rounded-xl bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-mono text-gray-700"
                placeholder="输入模型名称或选择预设"
              />
              <button
                type="button"
                onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <ChevronDown className={`w-4 h-4 transition-transform ${isModelDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
            </div>
            {isModelDropdownOpen && (
              <div className="absolute left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-50 max-h-60 overflow-y-auto">
                {MODEL_GROUPS.map(group => (
                  <div key={group.label} className="py-1">
                    <div className="px-3 py-1 text-[10px] font-bold text-gray-400 bg-gray-50 uppercase">{group.label}</div>
                    {group.models.map(m => (
                      <button
                        key={m.value}
                        onClick={() => { setSelectedModel(m.value); setIsModelDropdownOpen(false) }}
                        className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-blue-50 flex items-center justify-between"
                      >
                        <span className="font-mono">{m.value}</span>
                        {m.badge && <span className="text-[9px] bg-blue-50 text-blue-500 px-1 rounded font-bold">{m.badge}</span>}
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 语言选择 */}
          <div className="relative">
            <label className="block text-xs font-semibold text-gray-500 mb-1.5 flex items-center gap-1">
              <Globe className="w-3 h-3" /> 生成语言
            </label>
            <button
              onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
              className="w-full text-sm p-3 border border-gray-200 rounded-xl bg-gray-50/50 flex items-center justify-between hover:border-gray-300 transition-all"
            >
              <span className="text-gray-700">{selectedLanguage}</span>
              <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isLangDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            {isLangDropdownOpen && (
              <div className="absolute left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-50">
                {LANGUAGE_OPTIONS.map(lang => (
                  <button
                    key={lang.value}
                    onClick={() => {
                      setSelectedLanguage(lang.value)
                      setGuidelines(lang.guideline)
                      setIsLangDropdownOpen(false)
                    }}
                    className="w-full text-left px-4 py-2.5 text-xs text-gray-700 hover:bg-blue-50 flex items-center justify-between"
                  >
                    <span className="font-medium">{lang.label}</span>
                    {selectedLanguage === lang.value && <Check className="w-3.5 h-3.5 text-blue-500" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">
              最大章节数 ({maxSections} 章)
            </label>
            <input
              type="range" min={3} max={10} value={maxSections}
              onChange={e => setMaxSections(parseInt(e.target.value))}
              className="w-full accent-blue-500 mt-3"
            />
          </div>
        </div>

        {/* 选项 */}
        <div className="border-t border-gray-50 pt-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <label className="flex items-center gap-2 cursor-pointer text-xs">
              <input type="checkbox" checked={followGuidelines}
                onChange={e => setFollowGuidelines(e.target.checked)}
                className="w-4 h-4 rounded accent-blue-500" />
              <span className="text-gray-600 font-semibold">遵守写作准则</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-xs">
              <input type="checkbox" checked={verbose}
                onChange={e => setVerbose(e.target.checked)}
                className="w-4 h-4 rounded accent-blue-500" />
              <span className="text-gray-600 font-semibold">详细日志</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-xs">
              <input type="checkbox" checked={humanFeedback}
                onChange={e => setHumanFeedback(e.target.checked)}
                className="w-4 h-4 rounded accent-blue-500" />
              <span className="text-blue-600 font-semibold">人工反馈审阅</span>
            </label>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">计划修订次数</label>
              <input type="number" min={0} max={10} value={maxPlanRevisions}
                onChange={e => setMaxPlanRevisions(parseInt(e.target.value) || 3)}
                className="w-full text-sm p-2.5 border border-gray-200 rounded-lg bg-gray-50/50" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">写作准则（附加）</label>
              <input type="text" value={guidelines}
                onChange={e => setGuidelines(e.target.value)}
                className="w-full text-xs p-2.5 border border-gray-200 rounded-lg bg-gray-50/50" />
            </div>
          </div>
        </div>

        {/* 启动按钮 */}
        <div className="border-t border-gray-50 pt-6 space-y-3">
          {/* 积分消耗提示 */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500">本次操作将消耗</span>
            <span className="font-bold text-amber-600 flex items-center gap-1">
              <Coins className="w-3.5 h-3.5" />
              {RESEARCH_COST} 积分
            </span>
          </div>
          <button
            onClick={startGeneration}
            disabled={isRunning || pointsLoading || !session?.user || !canUsePoints}
            className="w-full py-4 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl transition-all shadow-md shadow-blue-500/10 flex items-center justify-center gap-2"
          >
            {!session?.user ? (
              <><AlertCircle className="w-4 h-4" /> 请先登录</>
            ) : !canUsePoints ? (
              <><AlertCircle className="w-4 h-4" /> 积分不足（需 {RESEARCH_COST} 积分）</>
            ) : isRunning ? (
              <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> 生成中...</>
            ) : pointsLoading ? (
              <><RefreshCw className="w-4 h-4 animate-spin" /> 校验积分中...</>
            ) : (
              <>🚀 开始生成研报（消耗 {RESEARCH_COST} 积分）</>
            )}
          </button>
          {session?.user && !canUsePoints && points !== null && (
            <p className="text-center text-xs text-red-500">
              当前积分 {points}，还差 {RESEARCH_COST - points} 积分
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
