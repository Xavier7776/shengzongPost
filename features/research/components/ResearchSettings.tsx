'use client'

import { RESEARCH_COST } from '@/features/research/lib/research'

export default function ResearchSettings() {
  return (
    <div className="p-6 max-w-2xl space-y-6">
      <h1 className="text-lg font-bold text-gray-800">系统设置</h1>
      <div className="bg-white border border-gray-100 rounded-2xl p-6 space-y-4 text-xs">
        <div className="flex justify-between items-center py-2 border-b border-gray-50">
          <div>
            <span className="font-bold text-gray-700 block">后端服务连接</span>
            <span className="text-gray-400 block mt-0.5">连接安全已启用</span>
          </div>
          <span className="text-[10px] bg-green-50 text-green-600 border border-green-100 px-2 py-1 rounded-md font-mono">已保护</span>
        </div>
        <div className="flex justify-between items-center py-2 border-b border-gray-50">
          <div>
            <span className="font-bold text-gray-700 block">详细日志模式</span>
            <span className="text-gray-400 block mt-0.5">显示详细运行信息</span>
          </div>
          <input type="checkbox" defaultChecked className="accent-blue-500 w-4 h-4" />
        </div>
        <div className="flex justify-between items-center py-2 border-b border-gray-50">
          <div>
            <span className="font-bold text-gray-700 block">深度研究费用</span>
            <span className="text-gray-400 block mt-0.5">每次生成研报消耗的积分</span>
          </div>
          <span className="font-bold text-amber-600">{RESEARCH_COST} 积分</span>
        </div>
        <div className="flex justify-between items-center py-2">
          <div>
            <span className="font-bold text-gray-700 block">自动下载 Markdown</span>
            <span className="text-gray-400 block mt-0.5">报告生成完成后自动下载</span>
          </div>
          <input type="checkbox" className="accent-blue-500 w-4 h-4" />
        </div>
      </div>
    </div>
  )
}
