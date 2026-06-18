'use client'

import { useState, useEffect } from 'react'
import { Check, X as XIcon, MousePointer, ShoppingBag } from 'lucide-react'
import Link from 'next/link'
import CursorPreview from './CursorPreview'
import type { CursorEffect } from './cursorTypes'

const RARITY_COLORS: Record<string, string> = {
  common: 'text-gray-500',
  rare: 'text-blue-500',
  epic: 'text-purple-500',
  legendary: 'text-amber-500',
}

const RARITY_LABEL: Record<string, string> = {
  common: '普通', rare: '稀有', epic: '史诗', legendary: '传说',
}

export default function CursorSelector() {
  const [effects, setEffects] = useState<CursorEffect[]>([])
  const [purchased, setPurchased] = useState<number[]>([])
  const [equippedId, setEquippedId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<number | null>(null)

  useEffect(() => {
    fetch('/api/shop/cursors')
      .then(r => r.json())
      .then(d => {
        setEffects(d.effects ?? [])
        setPurchased(d.purchased ?? [])
        setEquippedId(d.equippedEffectId ?? null)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  async function handleEquip(effectId: number | null) {
    setSaving(effectId ?? -1)
    try {
      const res = await fetch('/api/shop/cursors/equip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ effectId }),
      })
      if (res.ok) setEquippedId(effectId)
    } catch {}
    finally { setSaving(null) }
  }

  const ownedEffects = effects.filter(e => purchased.includes(e.id))

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <div className="w-6 h-6 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    )
  }

  if (ownedEffects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <div className="w-16 h-16 bg-slate-100 rounded-3xl flex items-center justify-center">
          <MousePointer className="w-8 h-8 text-slate-300" />
        </div>
        <p className="text-sm font-bold text-slate-400">暂无鼠标效果</p>
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

  const equippedEffect = effects.find(e => e.id === equippedId)

  return (
    <div className="space-y-6">
      {/* 当前装备 */}
      {equippedEffect && (
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-5 flex items-center justify-between border border-indigo-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 flex items-center justify-center">
              <CursorPreview effect={equippedEffect} size={48} />
            </div>
            <div>
              <p className="text-xs font-bold text-indigo-500 uppercase tracking-wider">当前装备</p>
              <p className="text-base font-black text-indigo-900 mt-0.5">{equippedEffect.name}</p>
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

      {/* 鼠标效果网格 */}
      <div className="grid grid-cols-2 gap-3">
        {ownedEffects.map(effect => {
          const isEquipped = equippedId === effect.id
          return (
            <button
              key={effect.id}
              onClick={() => handleEquip(isEquipped ? null : effect.id)}
              disabled={saving !== null}
              className={`relative flex flex-col items-center gap-3 p-5 rounded-2xl border-2 transition-all ${
                isEquipped
                  ? 'border-indigo-400 bg-indigo-50/80 shadow-sm'
                  : 'border-slate-100 bg-white hover:border-slate-200 hover:shadow-sm'
              }`}
            >
              <div className="w-12 h-12 flex items-center justify-center">
                <CursorPreview effect={effect} size={48} />
              </div>
              <div className="text-center">
                <span className="text-xs font-bold text-slate-700 block">{effect.name}</span>
                <span className={`text-[10px] ${RARITY_COLORS[effect.rarity] ?? 'text-gray-400'}`}>
                  {RARITY_LABEL[effect.rarity] ?? effect.rarity}
                </span>
              </div>
              {isEquipped && (
                <div className="absolute top-2.5 right-2.5 w-5 h-5 bg-indigo-600 rounded-full flex items-center justify-center shadow-sm">
                  <Check className="w-3 h-3 text-white" />
                </div>
              )}
              {saving === effect.id && (
                <div className="absolute inset-0 bg-white/80 rounded-2xl flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                </div>
              )}
            </button>
          )
        })}
      </div>

      <p className="text-xs text-slate-400 text-center">装备后刷新页面，角色即跟随光标 🐾</p>
    </div>
  )
}
