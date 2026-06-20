'use client'

import { useState, useEffect } from 'react'
import { Star, Sparkles, Crown, Gem, Shield, ShoppingBag, Check, ChevronRight } from 'lucide-react'

interface Frame {
  id: number; key: string; name: string; description: string | null
  price: number; rarity: string; css_key: string
}

interface ShopData {
  frames: Frame[]
  purchased: number[]
  equippedFrameId: number | null
  points: number
}

const RARITY: Record<string, { label: string; gradient: string; icon: typeof Star; ring: string }> = {
  common:    { label: '普通', gradient: 'from-slate-400 to-slate-500', icon: Shield,   ring: 'ring-slate-200' },
  rare:      { label: '稀有', gradient: 'from-blue-400 to-blue-600',  icon: Sparkles, ring: 'ring-blue-200' },
  epic:      { label: '史诗', gradient: 'from-purple-400 to-purple-600', icon: Crown, ring: 'ring-purple-200' },
  legendary: { label: '传说', gradient: 'from-amber-400 to-amber-600', icon: Gem,     ring: 'ring-amber-200' },
}

/* ── 头像框预览 ── */
function FramePreview({ cssKey, rarity, size = 56 }: { cssKey: string; rarity: string; size?: number }) {
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
      className="rounded-full flex items-center justify-center text-white font-black"
      style={{
        width: size, height: size,
        background: `linear-gradient(135deg, ${c1}, ${c2})`,
        fontSize: size * 0.35,
        textShadow: '0 1px 4px rgba(0,0,0,0.3)',
      }}
    >
      ✦
    </div>
  )

  // 渐变包裹型
  if (cssKey === 'rose_gold') {
    return (
      <div className="rounded-full p-1" style={{ background: 'linear-gradient(135deg, #f43f5e, #fbbf24, #f43f5e)' }}>
        {avatar}
      </div>
    )
  }
  if (cssKey === 'aurora') {
    return (
      <div className="rounded-full p-1" style={{ background: 'conic-gradient(#06b6d4, #8b5cf6, #ec4899, #f59e0b, #06b6d4)', animation: 'aurora-spin 3s linear infinite' }}>
        {avatar}
      </div>
    )
  }
  if (cssKey === 'diamond') {
    return (
      <div className="relative">
        <div className="absolute -inset-1.5 rounded-full" style={{ background: 'conic-gradient(#f43f5e, #f59e0b, #10b981, #3b82f6, #8b5cf6, #f43f5e)', animation: 'aurora-spin 2s linear infinite', filter: 'blur(2px)' }} />
        <div className="relative">{avatar}</div>
      </div>
    )
  }

  // box-shadow 型
  const shadowMap: Record<string, string> = {
    golden_ring: '0 0 0 3px #fbbf24, 0 0 0 6px #92400e, 0 0 12px 2px rgba(251,191,36,0.3)',
    neon_blue: '0 0 0 3px #3b82f6, 0 0 16px 4px rgba(59,130,246,0.5)',
    frost: '0 0 0 3px rgba(186,230,253,0.8), 0 0 20px 6px rgba(186,230,253,0.4)',
    flame: '0 0 10px 3px #ef4444, 0 0 20px 6px #f97316, 0 0 30px 8px rgba(239,68,68,0.3)',
  }

  return (
    <div style={{ borderRadius: '50%', boxShadow: shadowMap[cssKey] ?? 'none' }}>
      {avatar}
    </div>
  )
}

export default function FrameShop() {
  const [data, setData] = useState<ShopData | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<number | null>(null)
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  const fetchShopData = () => {
    fetch('/api/shop/frames')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => {
    fetchShopData()
  }, [])

  // 页面重新可见时刷新积分等数据
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') fetchShopData()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [])

  function flash(type: 'ok' | 'err', text: string) {
    setMsg({ type, text })
    setTimeout(() => setMsg(null), 3000)
  }

  async function handlePurchase(frame: Frame) {
    if (!data) return
    if (data.points < frame.price) { flash('err', '积分不足'); return }
    setBusy(frame.id)
    try {
      const res = await fetch('/api/shop/frames/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ frameId: frame.id }),
      })
      const r = await res.json()
      if (!res.ok) { flash('err', r.error ?? '购买失败'); return }
      // 购买成功后从服务器重新获取完整数据，确保积分准确
      fetchShopData()
      flash('ok', `购买成功「${frame.name}」✨`)
    } catch { flash('err', '网络错误') }
    finally { setBusy(null) }
  }

  async function handleEquip(frameId: number | null) {
    if (!data) return
    setBusy(frameId ?? -1)
    try {
      const res = await fetch('/api/shop/frames/equip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ frameId }),
      })
      const r = await res.json()
      if (!res.ok) { flash('err', r.error ?? '操作失败'); return }
      setData(prev => prev ? { ...prev, equippedFrameId: frameId } : prev)
      flash('ok', frameId ? '装备成功 🎉' : '已卸下')
      // 通知全局组件（UserMenu 等）刷新头像框
      window.dispatchEvent(new CustomEvent('frame-equipped', { detail: { frameId } }))
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

  const grouped = data.frames.reduce<Record<string, Frame[]>>((acc, f) => {
    ;(acc[f.rarity] ??= []).push(f)
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

      {/* 消息提示 */}
      {msg && (
        <div className={`text-sm font-bold px-4 py-3 rounded-xl ${msg.type === 'ok' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
          {msg.text}
        </div>
      )}

      {/* 按稀有度分组 */}
      {(['common', 'rare', 'epic', 'legendary'] as const).map(rarity => {
        const frames = grouped[rarity]
        if (!frames?.length) return null
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
              {frames.map(frame => {
                const owned = data.purchased.includes(frame.id)
                const equipped = data.equippedFrameId === frame.id
                const canAfford = data.points >= frame.price
                return (
                  <div
                    key={frame.id}
                    className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${
                      equipped
                        ? 'border-indigo-300 bg-indigo-50/60 shadow-sm'
                        : 'border-slate-100 bg-white hover:border-slate-200 hover:shadow-sm'
                    }`}
                  >
                    {/* 预览 */}
                    <div className="flex-shrink-0">
                      <FramePreview cssKey={frame.css_key} rarity={frame.rarity} size={48} />
                    </div>

                    {/* 信息 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-black text-slate-800">{frame.name}</h3>
                        {equipped && (
                          <span className="text-[10px] font-bold text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                            <Check className="w-3 h-3" />装备中
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">{frame.description}</p>
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span className="text-sm font-black text-slate-700">{frame.price}</span>
                      </div>
                    </div>

                    {/* 操作按钮 */}
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
                            onClick={() => handleEquip(frame.id)}
                            disabled={busy !== null}
                            className="text-xs font-bold px-4 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-all active:scale-95 shadow-sm shadow-indigo-200"
                          >
                            {busy === frame.id ? '...' : '装备'}
                          </button>
                        )
                      ) : (
                        <button
                          onClick={() => handlePurchase(frame)}
                          disabled={busy === frame.id || !canAfford}
                          className={`text-xs font-bold px-4 py-2 rounded-xl transition-all active:scale-95 ${
                            canAfford
                              ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm shadow-indigo-200'
                              : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                          }`}
                        >
                          {busy === frame.id ? '...' : canAfford ? '购买' : '积分不足'}
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
    </div>
  )
}
