'use client'

import { useState } from 'react'
import { MousePointer2, Square } from 'lucide-react'
import CursorAdmin from './CursorAdmin'
import FrameAdmin from './FrameAdmin'

export default function ShopAdminTabs() {
  const [tab, setTab] = useState<'cursors' | 'frames'>('cursors')

  return (
    <div className="space-y-6">
      {/* Tab 切换 */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-2xl max-w-md">
        <button
          onClick={() => setTab('cursors')}
          className={`flex-1 flex items-center justify-center gap-1.5 text-sm font-bold py-2.5 rounded-xl transition-all ${
            tab === 'cursors' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <MousePointer2 className="w-3.5 h-3.5" />
          鼠标效果
        </button>
        <button
          onClick={() => setTab('frames')}
          className={`flex-1 flex items-center justify-center gap-1.5 text-sm font-bold py-2.5 rounded-xl transition-all ${
            tab === 'frames' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <Square className="w-3.5 h-3.5" />
          头像框
        </button>
      </div>

      {tab === 'cursors' ? <CursorAdmin /> : <FrameAdmin />}
    </div>
  )
}
