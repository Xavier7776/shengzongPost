'use client'

import { useState } from 'react'
import FrameShop from './FrameShop'
import CursorShop from './CursorShop'

export default function ShopTabs() {
  const [tab, setTab] = useState<'frames' | 'cursors'>('frames')

  return (
    <div className="space-y-6">
      <div className="flex gap-1 p-1 bg-slate-100 rounded-2xl">
        <button
          onClick={() => setTab('frames')}
          className={`flex-1 text-sm font-bold py-2.5 rounded-xl transition-all ${
            tab === 'frames' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          头像框
        </button>
        <button
          onClick={() => setTab('cursors')}
          className={`flex-1 text-sm font-bold py-2.5 rounded-xl transition-all ${
            tab === 'cursors' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          鼠标效果
        </button>
      </div>

      {tab === 'frames' ? <FrameShop /> : <CursorShop />}
    </div>
  )
}
