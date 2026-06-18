'use client'

import { useEffect, useState } from 'react'
import { Trash2, Pencil, Check, X, Loader2, Plus, Star, Square } from 'lucide-react'
import type { AdminAvatarFrame } from './types'
import { RARITY_OPTIONS } from './types'

// ─── 头像框预览（与 FrameShop 一致的简化版）──────────────────────────────────
function FramePreview({ cssKey, rarity, size = 56 }: { cssKey: string; rarity: string; size?: number }) {
  const [c1, c2] = (() => {
    switch (rarity) {
      case 'rare':      return ['#60a5fa', '#3b82f6']
      case 'epic':      return ['#a78bfa', '#7c3aed']
      case 'legendary': return ['#fbbf24', '#f59e0b']
      default:          return ['#94a3b8', '#64748b']
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

  if (cssKey === 'rose_gold') {
    return <div className="rounded-full p-1" style={{ background: 'linear-gradient(135deg, #f43f5e, #fbbf24, #f43f5e)' }}>{avatar}</div>
  }
  if (cssKey === 'aurora') {
    return <div className="rounded-full p-1" style={{ background: 'conic-gradient(#06b6d4, #8b5cf6, #ec4899, #f59e0b, #06b6d4)', animation: 'aurora-spin 3s linear infinite' }}>{avatar}</div>
  }
  if (cssKey === 'diamond') {
    return (
      <div className="relative">
        <div className="absolute -inset-1.5 rounded-full" style={{ background: 'conic-gradient(#f43f5e, #f59e0b, #10b981, #3b82f6, #8b5cf6, #f43f5e)', animation: 'aurora-spin 2s linear infinite', filter: 'blur(2px)' }} />
        <div className="relative">{avatar}</div>
      </div>
    )
  }

  const shadowMap: Record<string, string> = {
    golden_ring: '0 0 0 3px #fbbf24, 0 0 0 6px #92400e, 0 0 12px 2px rgba(251,191,36,0.3)',
    neon_blue:   '0 0 0 3px #3b82f6, 0 0 16px 4px rgba(59,130,246,0.5)',
    frost:       '0 0 0 3px rgba(186,230,253,0.8), 0 0 20px 6px rgba(186,230,253,0.4)',
    flame:       '0 0 10px 3px #ef4444, 0 0 20px 6px #f97316, 0 0 30px 8px rgba(239,68,68,0.3)',
  }

  return <div style={{ borderRadius: '50%', boxShadow: shadowMap[cssKey] ?? 'none' }}>{avatar}</div>
}

// ─── 单条头像框卡片 ──────────────────────────────────────────────────────────
function FrameCard({
  frame,
  onDelete,
  onUpdate,
}: {
  frame: AdminAvatarFrame
  onDelete: (id: number) => void
  onUpdate: (id: number, data: Partial<AdminAvatarFrame>) => void
}) {
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({
    name: frame.name,
    description: frame.description ?? '',
    price: frame.price,
    rarity: frame.rarity,
    css_key: frame.css_key,
    enabled: frame.enabled,
  })
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (!editing) {
      setForm({
        name: frame.name,
        description: frame.description ?? '',
        price: frame.price,
        rarity: frame.rarity,
        css_key: frame.css_key,
        enabled: frame.enabled,
      })
    }
  }, [frame, editing])

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/shop/frames/${frame.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          description: form.description || null,
          price: Number(form.price),
          rarity: form.rarity,
          css_key: form.css_key,
          enabled: form.enabled,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || '保存失败')
      onUpdate(frame.id, data.frame)
      setEditing(false)
    } catch (err) {
      alert(err instanceof Error ? err.message : '保存失败')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!confirm(`确认删除头像框「${frame.name}」？\n\n已购买该头像框的用户记录会一并清除，此操作不可撤销。`)) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/shop/frames/${frame.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || '删除失败')
      }
      onDelete(frame.id)
    } catch (err) {
      alert(err instanceof Error ? err.message : '删除失败')
    } finally {
      setDeleting(false)
    }
  }

  const rarityCfg = RARITY_OPTIONS.find(r => r.value === frame.rarity)

  return (
    <div className={`group bg-white border rounded-2xl overflow-hidden transition-all duration-200 ${
      frame.enabled ? 'border-gray-100 hover:border-gray-200 hover:shadow-md' : 'border-gray-100 opacity-60'
    }`}>
      <div className="flex gap-4 p-4">
        {/* 预览 */}
        <div className="flex-shrink-0 w-16 h-16 flex items-center justify-center">
          <FramePreview cssKey={form.css_key} rarity={form.rarity} size={48} />
        </div>

        {/* 信息 */}
        <div className="flex-1 min-w-0">
          {editing ? (
            <div className="space-y-2">
              <input
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="名称"
                className="w-full text-sm font-bold text-gray-900 border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-400"
              />
              <input
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="描述（可选）"
                className="w-full text-xs text-gray-500 border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-400"
              />
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-black text-gray-900">{frame.name}</h3>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${rarityCfg?.color}`}>
                  {rarityCfg?.label}
                </span>
                {!frame.enabled && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-red-100 text-red-600">
                    已禁用
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">
                {frame.description || <span className="italic">无描述</span>}
              </p>
              <div className="flex items-center gap-3 mt-1.5 text-xs">
                <span className="flex items-center gap-1 font-bold text-gray-700">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  {frame.price}
                </span>
                <span className="text-gray-400 font-mono">{frame.key}</span>
                <span className="text-gray-400 font-mono">css: {frame.css_key}</span>
              </div>
            </>
          )}
        </div>

        {!editing && (
          <div className="flex-shrink-0 flex gap-1">
            <button
              onClick={() => setEditing(true)}
              className="shrink-0 text-gray-300 hover:text-gray-600 p-1.5 rounded-lg transition-colors"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="shrink-0 text-gray-300 hover:text-red-500 p-1.5 rounded-lg transition-colors disabled:opacity-50"
            >
              {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        )}
      </div>

      {editing && (
        <div className="border-t border-gray-100 px-4 py-3 space-y-3 bg-slate-50/50">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1 block">价格</label>
              <input
                type="number"
                value={form.price}
                onChange={e => setForm(f => ({ ...f, price: Number(e.target.value) }))}
                min={0}
                className="w-full text-sm font-bold border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-400"
              />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1 block">稀有度</label>
              <select
                value={form.rarity}
                onChange={e => setForm(f => ({ ...f, rarity: e.target.value as AdminAvatarFrame['rarity'] }))}
                className="w-full text-sm font-bold border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-400 bg-white"
              >
                {RARITY_OPTIONS.map(r => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1 block">CSS Key</label>
            <input
              value={form.css_key}
              onChange={e => setForm(f => ({ ...f, css_key: e.target.value }))}
              placeholder="如 golden_ring / aurora / diamond"
              className="w-full text-sm font-mono border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-400"
            />
            <p className="text-[10px] text-gray-400 mt-1">
              预置支持：golden_ring / neon_blue / frost / rose_gold / aurora / flame / diamond
            </p>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.enabled}
              onChange={e => setForm(f => ({ ...f, enabled: e.target.checked }))}
              className="w-4 h-4 rounded accent-blue-600"
            />
            <span className="text-xs font-bold text-gray-700">启用（取消则商城不展示）</span>
          </label>

          <div className="flex gap-2 pt-1">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2 rounded-lg transition-colors disabled:opacity-60"
            >
              {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
              保存
            </button>
            <button
              onClick={() => setEditing(false)}
              className="flex items-center justify-center px-4 bg-gray-100 hover:bg-gray-200 text-gray-500 text-xs font-bold py-2 rounded-lg transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── 新建表单 ────────────────────────────────────────────────────────────────
function NewFrameForm({ onCreated }: { onCreated: (frame: AdminAvatarFrame) => void }) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<{
    key: string
    name: string
    description: string
    price: number
    rarity: AdminAvatarFrame['rarity']
    css_key: string
    enabled: boolean
  }>({
    key: '',
    name: '',
    description: '',
    price: 200,
    rarity: 'common',
    css_key: 'golden_ring',
    enabled: true,
  })
  const [creating, setCreating] = useState(false)

  async function handleCreate() {
    if (!form.key || !form.name || !form.css_key) {
      alert('key、名称、CSS Key 必填')
      return
    }
    if (!/^[a-z0-9-]+$/.test(form.key)) {
      alert('key 只能包含小写字母、数字、连字符')
      return
    }
    setCreating(true)
    try {
      const res = await fetch('/api/admin/shop/frames', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: form.key,
          name: form.name,
          description: form.description || null,
          price: Number(form.price),
          rarity: form.rarity,
          css_key: form.css_key,
          enabled: form.enabled,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || '创建失败')
      onCreated(data.frame)
      setForm({ key: '', name: '', description: '', price: 200, rarity: 'common', css_key: 'golden_ring', enabled: true })
      setOpen(false)
    } catch (err) {
      alert(err instanceof Error ? err.message : '创建失败')
    } finally {
      setCreating(false)
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-200 hover:border-blue-400 hover:bg-blue-50/50 rounded-2xl text-sm font-bold text-gray-400 hover:text-blue-600 transition-all"
      >
        <Plus className="w-4 h-4" />
        新增头像框
      </button>
    )
  }

  return (
    <div className="bg-white border border-blue-200 rounded-2xl p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-black text-gray-900">新增头像框</h3>
        <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600 p-1">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1 block">key（唯一）</label>
          <input
            value={form.key}
            onChange={e => setForm(f => ({ ...f, key: e.target.value.toLowerCase() }))}
            placeholder="如 my-frame"
            className="w-full text-sm font-mono border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-400"
          />
        </div>
        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1 block">名称</label>
          <input
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="如 我的头像框"
            className="w-full text-sm font-bold border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-400"
          />
        </div>
      </div>

      <div>
        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1 block">描述</label>
        <input
          value={form.description}
          onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          placeholder="简短描述（可选）"
          className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-400"
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1 block">价格</label>
          <input
            type="number"
            value={form.price}
            onChange={e => setForm(f => ({ ...f, price: Number(e.target.value) }))}
            min={0}
            className="w-full text-sm font-bold border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-400"
          />
        </div>
        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1 block">稀有度</label>
          <select
            value={form.rarity}
            onChange={e => setForm(f => ({ ...f, rarity: e.target.value as AdminAvatarFrame['rarity'] }))}
            className="w-full text-sm font-bold border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-400 bg-white"
          >
            {RARITY_OPTIONS.map(r => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1 block">CSS Key</label>
          <input
            value={form.css_key}
            onChange={e => setForm(f => ({ ...f, css_key: e.target.value }))}
            placeholder="golden_ring"
            className="w-full text-sm font-mono border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-400"
          />
        </div>
      </div>

      <div className="flex gap-2 pt-1">
        <button
          onClick={() => setOpen(false)}
          disabled={creating}
          className="px-5 py-2 rounded-xl text-sm font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-50"
        >
          取消
        </button>
        <button
          onClick={handleCreate}
          disabled={creating}
          className="flex-1 py-2 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {creating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
          创建
        </button>
      </div>
    </div>
  )
}

// ─── 主组件 ──────────────────────────────────────────────────────────────────
export default function FrameAdmin() {
  const [frames, setFrames] = useState<AdminAvatarFrame[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    fetch('/api/admin/shop/frames')
      .then(async r => {
        const data = await r.json()
        if (!r.ok) throw new Error(data?.error || `HTTP ${r.status}`)
        return data
      })
      .then(data => {
        setFrames(Array.isArray(data.frames) ? data.frames : [])
        setLoading(false)
      })
      .catch(err => {
        console.error('[frame admin load]', err)
        setLoadError(String(err))
        setLoading(false)
      })
  }, [])

  function handleCreated(frame: AdminAvatarFrame) {
    setFrames(prev => [frame, ...prev])
  }
  function handleUpdate(id: number, data: Partial<AdminAvatarFrame>) {
    setFrames(prev => prev.map(f => f.id === id ? { ...f, ...data } as AdminAvatarFrame : f))
  }
  function handleDelete(id: number) {
    setFrames(prev => prev.filter(f => f.id !== id))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-gray-300">
        <Loader2 className="w-8 h-8 animate-spin" />
        <span className="ml-3 text-sm font-medium">正在读取头像框…</span>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="text-center py-24 text-red-400 space-y-3">
        <p className="font-bold text-base">读取失败</p>
        <p className="text-xs font-mono bg-red-50 inline-block px-3 py-1.5 rounded-lg">{loadError}</p>
        <div>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-600 text-xs font-bold rounded-xl transition-colors"
          >
            刷新重试
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <p className="text-xs text-gray-400">共 {frames.length} 个头像框</p>
      <NewFrameForm onCreated={handleCreated} />
      {frames.length === 0 ? (
        <div className="text-center py-20 text-gray-300">
          <Square className="w-12 h-12 mx-auto mb-4" />
          <p className="font-bold">还没有头像框，点击上方按钮新增</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {frames.map(frame => (
            <FrameCard
              key={frame.id}
              frame={frame}
              onDelete={handleDelete}
              onUpdate={handleUpdate}
            />
          ))}
        </div>
      )}
    </div>
  )
}
