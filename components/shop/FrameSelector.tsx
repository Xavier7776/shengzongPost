'use client'

import { useState, useEffect } from 'react'
import { Check, X as XIcon, Palette, ShoppingBag } from 'lucide-react'
import Link from 'next/link'

interface Frame {
  id: number; key: string; name: string; description: string | null
  price: number; rarity: string; css_key: string
}

const RARITY_COLORS: Record<string, string> = {
  common: 'text-gray-500',
  rare: 'text-blue-500',
  epic: 'text-purple-500',
  legendary: 'text-amber-500',
}

function MiniPreview({ cssKey, rarity, size = 44 }: { cssKey: string; rarity?: string; size?: number }) {
  const [c1, c2] = (() => {
    switch (rarity) {
      case 'rare': return ['#60a5fa', '#3b82f6']
      case 'epic': return ['#a78bfa', '#7c3aed']
      case 'legendary': return ['#fbbf24', '#f59e0b']
      default: return ['#94a3b8', '#64748b']
    }
  })()

  const avatar = (
    <div
      className="rounded-full flex items-center justify-center text-white font-black text-xs"
      style={{ width: size, height: size, background: `linear-gradient(135deg, ${c1}, ${c2})` }}
    >
      ✦
    </div>
  )

  if (cssKey === 'rose_gold') {
    return <div className="rounded-full p-[3px]" style={{ background: 'linear-gradient(135deg, #f43f5e, #fbbf24, #f43f5e)' }}>{avatar}</div>
  }
  if (cssKey === 'aurora') {
    return <div className="rounded-full p-[3px]" style={{ background: 'conic-gradient(#06b6d4, #8b5cf6, #ec4899, #f59e0b, #06b6d4)', animation: 'aurora-spin 3s linear infinite' }}>{avatar}</div>
  }
  if (cssKey === 'diamond') {
    return (
      <div className="relative">
        <div className="absolute -inset-1 rounded-full" style={{ background: 'conic-gradient(#f43f5e, #f59e0b, #10b981, #3b82f6, #8b5cf6, #f43f5e)', animation: 'aurora-spin 2s linear infinite', filter: 'blur(2px)' }} />
        <div className="relative">{avatar}</div>
      </div>
    )
  }

  const shadowMap: Record<string, string> = {
    golden_ring: '0 0 0 3px #fbbf24, 0 0 0 5px #92400e, 0 0 10px 2px rgba(251,191,36,0.3)',
    neon_blue: '0 0 0 2px #3b82f6, 0 0 12px 3px rgba(59,130,246,0.4)',
    frost: '0 0 0 2px rgba(186,230,253,0.7), 0 0 16px 4px rgba(186,230,253,0.4)',
    flame: '0 0 8px 2px #ef4444, 0 0 16px 4px #f97316, 0 0 24px 6px rgba(239,68,68,0.3)',
  }

  return <div style={{ borderRadius: '50%', boxShadow: shadowMap[cssKey] ?? 'none' }}>{avatar}</div>
}

export default function FrameSelector({ currentAvatarUrl }: { currentAvatarUrl?: string }) {
  const [frames, setFrames] = useState<Frame[]>([])
  const [purchased, setPurchased] = useState<number[]>([])
  const [equippedId, setEquippedId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<number | null>(null)

  useEffect(() => {
    fetch('/api/shop/frames')
      .then(r => r.json())
      .then(d => {
        setFrames(d.frames ?? [])
        setPurchased(d.purchased ?? [])
        setEquippedId(d.equippedFrameId ?? null)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  async function handleEquip(frameId: number | null) {
    setSaving(frameId ?? -1)
    try {
      const res = await fetch('/api/shop/frames/equip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ frameId }),
      })
      if (res.ok) setEquippedId(frameId)
    } catch {}
    finally { setSaving(null) }
  }

  const ownedFrames = frames.filter(f => purchased.includes(f.id))

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <div className="w-6 h-6 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    )
  }

  if (ownedFrames.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <div className="w-16 h-16 bg-slate-100 rounded-3xl flex items-center justify-center">
          <Palette className="w-8 h-8 text-slate-300" />
        </div>
        <p className="text-sm font-bold text-slate-400">暂无头像框</p>
        <Link
          href="/shop"
          className="flex items-center gap-1.5 text-sm font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-4 py-2 rounded-xl transition-colors"
        >
          <ShoppingBag className="w-4 h-4" />
          前往积分商城
        </Link>
      </div>
    )
  }

  const equippedFrame = frames.find(f => f.id === equippedId)

  return (
    <div className="space-y-6">
      {/* 当前装备 */}
      {equippedFrame && (
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-5 flex items-center justify-between border border-indigo-100">
          <div className="flex items-center gap-4">
            <MiniPreview cssKey={equippedFrame.css_key} rarity={equippedFrame.rarity} size={48} />
            <div>
              <p className="text-xs font-bold text-indigo-500 uppercase tracking-wider">当前装备</p>
              <p className="text-base font-black text-indigo-900 mt-0.5">{equippedFrame.name}</p>
            </div>
          </div>
          <button
            onClick={() => handleEquip(null)}
            disabled={saving !== null}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-red-500 bg-white px-3 py-2 rounded-xl border border-slate-200 hover:border-red-200 hover:bg-red-50 transition-all"
          >
            <XIcon className="w-3.5 h-3.5" />
            卸下
          </button>
        </div>
      )}

      {/* 头像框网格 */}
      <div className="grid grid-cols-2 gap-3">
        {ownedFrames.map(frame => {
          const isEquipped = equippedId === frame.id
          return (
            <button
              key={frame.id}
              onClick={() => handleEquip(isEquipped ? null : frame.id)}
              disabled={saving !== null}
              className={`relative flex flex-col items-center gap-3 p-5 rounded-2xl border-2 transition-all ${
                isEquipped
                  ? 'border-indigo-400 bg-indigo-50/80 shadow-sm'
                  : 'border-slate-100 bg-white hover:border-slate-200 hover:shadow-sm'
              }`}
            >
              <MiniPreview cssKey={frame.css_key} rarity={frame.rarity} />
              <div className="text-center">
                <span className="text-xs font-bold text-slate-700 block">{frame.name}</span>
                <span className={`text-[10px] ${RARITY_COLORS[frame.rarity] ?? 'text-gray-400'}`}>
                  {frame.rarity === 'common' ? '普通' : frame.rarity === 'rare' ? '稀有' : frame.rarity === 'epic' ? '史诗' : '传说'}
                </span>
              </div>
              {isEquipped && (
                <div className="absolute top-2.5 right-2.5 w-5 h-5 bg-indigo-600 rounded-full flex items-center justify-center shadow-sm">
                  <Check className="w-3 h-3 text-white" />
                </div>
              )}
              {saving === frame.id && (
                <div className="absolute inset-0 bg-white/80 rounded-2xl flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                </div>
              )}
            </button>
          )
        })}
      </div>

      <Link
        href="/shop"
        className="flex items-center justify-center gap-2 text-sm font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 py-3 rounded-xl transition-colors"
      >
        <ShoppingBag className="w-4 h-4" />
        前往积分商城
      </Link>
    </div>
  )
}
