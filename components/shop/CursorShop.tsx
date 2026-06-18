'use client'

import { useState, useEffect } from 'react'
import { Star, Sparkles, Crown, Gem, Shield, Check } from 'lucide-react'
import CursorPreview from './CursorPreview'
import type { CursorEffect, CursorShopData } from './cursorTypes'

const RARITY: Record<string, { label: string; gradient: string; icon: typeof Star; ring: string }> = {
  common:    { label: '普通', gradient: 'from-slate-400 to-slate-500',   icon: Shield,   ring: 'ring-slate-200' },
  rare:      { label: '稀有', gradient: 'from-blue-400 to-blue-600',     icon: Sparkles, ring: 'ring-blue-200' },
  epic:      { label: '史诗', gradient: 'from-purple-400 to-purple-600', icon: Crown,    ring: 'ring-purple-200' },
  legendary: { label: '传说', gradient: 'from-amber-400 to-amber-600',   icon: Gem,      ring: 'ring-amber-200' },
}

export default function CursorShop() {
  const [data, setData] = useState<CursorShopData | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<number | null>(null)
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  const fetchShopData = () => {
    fetch('/api/shop/cursors')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => { fetchShopData() }, [])

  function flash(type: 'ok' | 'err', text: string) {
    setMsg({ type, text })
    setTimeout(() => setMsg(null), 3000)
  }

  async function handlePurchase(effect: CursorEffect) {
    if (!data) return
    if (data.points < effect.price) { flash('err', '积分不足'); return }
    setBusy(effect.id)
    try {
      const res = await fetch('/api/shop/cursors/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ effectId: effect.id }),
      })
      const r = await res.json()
      if (!res.ok) { flash('err', r.error ?? '购买失败'); return }
      fetchShopData()
      flash('ok', `购买成功「${effect.name}」✨`)
    } catch { flash('err', '网络错误') }
    finally { setBusy(null) }
  }

  async function handleEquip(effectId: number | null) {
    if (!data) return
    setBusy(effectId ?? -1)
    try {
      const res = await fetch('/api/shop/cursors/equip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ effectId }),
      })
      const r = await res.json()
      if (!res.ok) { flash('err', r.error ?? '操作失败'); return }
      setData(prev => prev ? { ...prev, equippedEffectId: effectId } : prev)
      flash('ok', effectId ? '装备成功，刷新页面后跟随生效 🎉' : '已卸下')
    } catch { flash('err', '网络错误') }
    finally { setBusy(null) }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    )
  }
  if (!data) return <p className="text-center text-slate-400 py-10">加载失败</p>

  const grouped = data.effects.reduce<Record<string, CursorEffect[]>>((acc, e) => {
    ;(acc[e.rarity] ??= []).push(e)
    return acc
  }, {})

  return (
    <div className="space-y-8">
      {/* 积分卡 */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-5 flex items-center justify-between border border-amber-100">
        <div>
          <p className="text-xs font-bold text-amber-600 uppercase tracking-wider">我的积分</p>
          <p className="text-3xl font-black text-amber-700 mt-1 tabular-nums">{data.points.toLocaleString()}</p>
        </div>
        <div className="w-14 h-14 bg-amber-100 rounded-2xl flex items-center justify-center">
          <Star className="w-7 h-7 fill-amber-400 text-amber-400" />
        </div>
      </div>

      {msg && (
        <div className={`text-sm font-bold px-4 py-3 rounded-xl ${msg.type === 'ok' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
          {msg.text}
        </div>
      )}

      {(['common', 'rare', 'epic', 'legendary'] as const).map(rarity => {
        const effects = grouped[rarity]
        if (!effects?.length) return null
        const cfg = RARITY[rarity]
        const Icon = cfg.icon
        return (
          <div key={rarity} className="space-y-3">
            <div className="flex items-center gap-2.5">
              <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${cfg.gradient} flex items-center justify-center`}>
                <Icon className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-black text-slate-800">{cfg.label}</span>
              <div className="flex-1 h-px bg-slate-100" />
            </div>

            <div className="space-y-2">
              {effects.map(effect => {
                const owned = data.purchased.includes(effect.id)
                const equipped = data.equippedEffectId === effect.id
                const canAfford = data.points >= effect.price
                return (
                  <div
                    key={effect.id}
                    className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${
                      equipped
                        ? 'border-indigo-300 bg-indigo-50/60 shadow-sm'
                        : 'border-slate-100 bg-white hover:border-slate-200 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center">
                      <CursorPreview effect={effect} size={48} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-black text-slate-800">{effect.name}</h3>
                        {equipped && (
                          <span className="text-[10px] font-bold text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                            <Check className="w-3 h-3" />装备中
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{effect.description}</p>
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span className="text-sm font-black text-slate-700">{effect.price}</span>
                      </div>
                    </div>

                    <div className="flex-shrink-0">
                      {owned ? (
                        equipped ? (
                          <button
                            onClick={() => handleEquip(null)}
                            disabled={busy !== null}
                            className="text-xs font-bold px-4 py-2 rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 transition-all active:scale-95"
                          >
                            {busy === -1 ? '...' : '卸下'}
                          </button>
                        ) : (
                          <button
                            onClick={() => handleEquip(effect.id)}
                            disabled={busy !== null}
                            className="text-xs font-bold px-4 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-all active:scale-95 shadow-sm shadow-indigo-200"
                          >
                            {busy === effect.id ? '...' : '装备'}
                          </button>
                        )
                      ) : (
                        <button
                          onClick={() => handlePurchase(effect)}
                          disabled={busy === effect.id || !canAfford}
                          className={`text-xs font-bold px-4 py-2 rounded-xl transition-all active:scale-95 ${
                            canAfford
                              ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm shadow-indigo-200'
                              : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                          }`}
                        >
                          {busy === effect.id ? '...' : canAfford ? '购买' : '积分不足'}
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}

      <p className="text-xs text-slate-400 text-center pt-2">装备鼠标效果后，刷新页面即可看到角色跟随你的光标 🐾</p>
    </div>
  )
}
