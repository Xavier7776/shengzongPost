'use client'

import type { ResearchState } from '../useResearch'

type Props = Pick<ResearchState,
  | 'logs'
>

export default function ResearchLogs({
  logs,
}: Props) {
  return (
    <div className="p-6 space-y-4">
      <h1 className="text-lg font-bold text-gray-800">全链运行日志</h1>
      <div className="bg-[#1A1B1E] text-[#86C232] p-5 rounded-2xl font-mono text-xs max-h-[600px] overflow-y-auto space-y-1">
        <p className="text-gray-500">运行日志</p>
        {logs.length === 0 ? (
          <p className="text-gray-500">暂无日志</p>
        ) : (
          logs.map((log, idx) => (
            <p key={idx}>
              <span className="text-gray-600">[{log.time}]</span>{' '}
              <span className="text-blue-400">[{log.agent}]</span>{' '}
              {log.text}
            </p>
          ))
        )}
      </div>
    </div>
  )
}
