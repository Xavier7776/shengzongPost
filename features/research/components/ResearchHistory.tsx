'use client'

import { ListTodo, Clock, AlertCircle, RefreshCw, Globe, Trash2 } from 'lucide-react'
import type { ResearchState } from '../useResearch'

type Props = Pick<ResearchState,
  | 'fetchHistoryReports'
  | 'historyLoading'
  | 'session'
  | 'historyReports'
  | 'setActiveMenu'
  | 'openHistoryReport'
  | 'deleteHistoryReport'
>

export default function ResearchHistory({
  fetchHistoryReports, historyLoading, session, historyReports, setActiveMenu, openHistoryReport,
  deleteHistoryReport,
}: Props) {
  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-800">历史研报</h1>
          <p className="text-xs text-gray-400 mt-1">查看之前生成的深度研究报告</p>
        </div>
        <button
          onClick={fetchHistoryReports}
          disabled={historyLoading}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 text-xs font-bold rounded-lg transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${historyLoading ? 'animate-spin' : ''}`} />
          刷新
        </button>
      </div>

      {!session?.user ? (
        <div className="bg-white border border-gray-100 rounded-2xl p-12 text-center">
          <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-3">
            <AlertCircle className="w-6 h-6" />
          </div>
          <p className="text-sm text-gray-500">请先登录查看历史研报</p>
        </div>
      ) : historyLoading ? (
        <div className="bg-white border border-gray-100 rounded-2xl p-12 text-center">
          <RefreshCw className="w-6 h-6 text-blue-500 animate-spin mx-auto mb-3" />
          <p className="text-xs text-gray-400">加载中...</p>
        </div>
      ) : historyReports.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-2xl p-12 text-center">
          <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-3">
            <ListTodo className="w-6 h-6" />
          </div>
          <p className="text-sm text-gray-500 mb-2">暂无历史研报</p>
          <p className="text-xs text-gray-400">前往配置中心生成你的第一份深度研究报告</p>
          <button
            onClick={() => setActiveMenu('配置中心')}
            className="mt-4 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold rounded-xl transition-all"
          >
            前往配置中心
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {historyReports.map(report => (
            <div
              key={report.id}
              className="bg-white border border-gray-100 rounded-2xl p-5 hover:border-blue-200 hover:shadow-sm transition-all cursor-pointer group"
              onClick={() => openHistoryReport(report)}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-gray-800 truncate">{report.topic}</h3>
                  <div className="flex items-center gap-3 mt-2 text-[10px] text-gray-400">
                    <span className="flex items-center gap-1">
                      <Globe className="w-3 h-3" /> {report.language}
                    </span>
                    <span className="font-mono">{report.model}</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {Math.floor(report.elapsed_seconds / 60)}m {report.elapsed_seconds % 60}s
                    </span>
                    <span>{new Date(report.created_at).toLocaleString('zh-CN')}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="px-2 py-1 bg-green-50 text-green-600 text-[10px] font-bold rounded">
                    已完成
                  </span>
                  <button
                    onClick={(e) => deleteHistoryReport(report.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                    title="删除研报"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
