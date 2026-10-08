'use client'

import Link from 'next/link'
import { FileText, Copy, Download, BookOpen, Coins, AlertCircle, RefreshCw } from 'lucide-react'
import type { ResearchState } from '../useResearch'
import { RESEARCH_COST } from '@/features/research/lib/research'

type Props = Pick<ResearchState,
  | 'humanFeedbackPrompt'
  | 'planContent'
  | 'humanFeedbackInput'
  | 'setHumanFeedbackInput'
  | 'submitHumanFeedback'
  | 'showInsufficientModal'
  | 'points'
  | 'setShowInsufficientModal'
  | 'showReportModal'
  | 'setShowReportModal'
  | 'reportContent'
  | 'copyAll'
  | 'downloadMd'
  | 'viewingReport'
  | 'setViewingReport'
  | 'viewingLoading'
>

export default function ResearchDialogs({
  humanFeedbackPrompt, planContent, humanFeedbackInput, setHumanFeedbackInput, submitHumanFeedback,
  showInsufficientModal, points, setShowInsufficientModal, showReportModal, setShowReportModal,
  reportContent, copyAll, downloadMd, viewingReport, setViewingReport, viewingLoading,
}: Props) {
  return (
    <>
    {humanFeedbackPrompt && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
              <div className="bg-amber-500 text-white p-4 flex items-center gap-2 shrink-0">
                <span className="text-lg">🤖</span>
                <div>
                  <h3 className="font-bold text-sm">人工审阅请求</h3>
                  <p className="text-[10px] text-white/80 mt-0.5">系统正在等待您的反馈</p>
                </div>
              </div>
              <div className="p-6 overflow-y-auto">
                <p className="text-sm text-gray-700 mb-3 leading-relaxed">{humanFeedbackPrompt}</p>
                {/* 研究计划内容展示 */}
                {planContent && (
                  <div className="mb-4">
                    <div className="flex items-center gap-1.5 mb-2">
                      <FileText className="w-3.5 h-3.5 text-amber-500" />
                      <span className="text-xs font-bold text-gray-700">研究计划详情</span>
                    </div>
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 max-h-60 overflow-y-auto">
                      <pre className="whitespace-pre-wrap text-[11px] text-gray-600 font-mono leading-relaxed">{planContent}</pre>
                    </div>
                  </div>
                )}
                <textarea
                  value={humanFeedbackInput}
                  onChange={e => setHumanFeedbackInput(e.target.value)}
                  className="w-full text-sm p-3 border border-gray-200 rounded-xl bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                  rows={3}
                  placeholder="请输入您的反馈意见（中文）。留空提交表示接受当前计划。"
                  autoFocus
                />
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => { setHumanFeedbackInput(''); setTimeout(submitHumanFeedback, 0) }}
                    className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-all"
                  >
                    接受当前计划
                  </button>
                  <button
                    onClick={submitHumanFeedback}
                    className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl transition-all shadow-sm"
                  >
                    提交反馈
                  </button>
                </div>
                <p className="text-[10px] text-gray-400 mt-3 text-center">
                  提交后将进入 Researcher 节点继续深度研究
                </p>
              </div>
            </div>
          </div>
        )}

    {showInsufficientModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden">
              <div className="bg-red-500 text-white p-4 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                <div>
                  <h3 className="font-bold text-sm">积分不足</h3>
                  <p className="text-[10px] text-white/80 mt-0.5">无法启动深度研究</p>
                </div>
              </div>
              <div className="p-6 text-center">
                <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Coins className="w-8 h-8" />
                </div>
                <p className="text-sm text-gray-700 mb-2">
                  深度研究每次需要 <span className="font-bold text-amber-600">{RESEARCH_COST} 积分</span>
                </p>
                <p className="text-xs text-gray-400 mb-6">
                  当前积分余额：<span className="font-bold text-gray-700">{points ?? 0}</span>
                  ，还差 <span className="font-bold text-red-500">{RESEARCH_COST - (points ?? 0)}</span> 积分
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowInsufficientModal(false)}
                    className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-all"
                  >
                    稍后再说
                  </button>
                  <Link
                    href="/blog"
                    onClick={() => setShowInsufficientModal(false)}
                    className="flex-1 py-2.5 bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold rounded-xl transition-all"
                  >
                    去阅读文章赚积分
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

    {showReportModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl flex flex-col h-[85vh] overflow-hidden">
              <div className="bg-blue-500 text-white p-5 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  <div>
                    <h3 className="font-bold text-sm">研报结果</h3>
                    <p className="text-[10px] text-white/80 mt-0.5">基于多 Agent 协作生成</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowReportModal(false)}
                  className="text-white hover:text-gray-100 font-bold bg-white/20 p-1.5 rounded-lg text-xs"
                >
                  关闭 ✕
                </button>
              </div>
              <div className="flex-1 p-6 md:p-8 overflow-y-auto bg-[#FAFBFD]">
                {reportContent ? (
                  <div className="prose max-w-none">
                    <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans leading-relaxed">{reportContent}</pre>
                  </div>
                ) : (
                  <p className="text-gray-400 text-center py-12">暂无报告内容</p>
                )}
              </div>
              <div className="bg-gray-50 p-4 border-t border-gray-100 flex items-center justify-end gap-2 shrink-0">
                <button
                  onClick={copyAll}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5"
                >
                  <Copy className="w-4 h-4" />
                  复制全文
                </button>
                <button
                  onClick={downloadMd}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-sm"
                >
                  <Download className="w-4 h-4" />
                  下载 Markdown
                </button>
              </div>
            </div>
          </div>
        )}

    {viewingReport && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl flex flex-col h-[85vh] overflow-hidden">
              <div className="bg-indigo-500 text-white p-5 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2 min-w-0">
                  <BookOpen className="w-5 h-5 shrink-0" />
                  <div className="min-w-0">
                    <h3 className="font-bold text-sm truncate">{viewingReport.topic}</h3>
                    <p className="text-[10px] text-white/80 mt-0.5">
                      {viewingReport.language} · {viewingReport.model} · {Math.floor(viewingReport.elapsed_seconds / 60)}m {viewingReport.elapsed_seconds % 60}s
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setViewingReport(null)}
                  className="text-white hover:text-gray-100 font-bold bg-white/20 p-1.5 rounded-lg text-xs shrink-0"
                >
                  关闭 ✕
                </button>
              </div>
              <div className="flex-1 p-6 md:p-8 overflow-y-auto bg-[#FAFBFD]">
                {viewingLoading ? (
                  <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                    <RefreshCw className="w-6 h-6 animate-spin mb-3" />
                    <p className="text-xs">正在加载报告内容...</p>
                  </div>
                ) : viewingReport.report_content ? (
                  <div className="prose max-w-none">
                    <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans leading-relaxed">{viewingReport.report_content}</pre>
                  </div>
                ) : (
                  <p className="text-gray-400 text-center py-12">暂无报告内容</p>
                )}
              </div>
              <div className="bg-gray-50 p-4 border-t border-gray-100 flex items-center justify-end gap-2 shrink-0">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(viewingReport.report_content || '')
                  }}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5"
                >
                  <Copy className="w-4 h-4" />
                  复制全文
                </button>
                <button
                  onClick={() => {
                    const blob = new Blob([viewingReport.report_content || ''], { type: 'text/markdown;charset=utf-8' })
                    const url = URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url
                    a.download = `research-${viewingReport.id}.md`
                    a.click()
                    URL.revokeObjectURL(url)
                  }}
                  className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-sm"
                >
                  <Download className="w-4 h-4" />
                  下载 Markdown
                </button>
              </div>
            </div>
          </div>
        )}
    </>
  )
}
