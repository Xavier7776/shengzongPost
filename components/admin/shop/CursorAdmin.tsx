'use client'

import { useEffect, useRef, useState } from 'react'
import {
  Upload, Trash2, Pencil, Check, X, ImageOff, Loader2, Plus, Star, Gift,
} from 'lucide-react'
import type { AdminCursorEffect } from './types'
import { RARITY_OPTIONS, RENDER_TYPE_OPTIONS } from './types'

// ─── 默认值（新建用）─────────────────────────────────────────────────────────
interface NewCursorFormState {
  key: string
  name: string
  description: string
  price: number
  rarity: AdminCursorEffect['rarity']
  sprite_url: string
  poster_url: string
  scale: number
  follow_easing: number
  emoji: string
  render_type: AdminCursorEffect['render_type']
  enabled: boolean
}

const DEFAULT_NEW_CURSOR: NewCursorFormState = {
  key: '',
  name: '',
  description: '',
  price: 300,
  rarity: 'common',
  sprite_url: '',
  poster_url: '',
  scale: 96,
  follow_easing: 0.13,
  emoji: '👻',
  render_type: 'gif',  // 管理端新建默认 GIF（最常用场景）
  enabled: true,
}

// ─── 单条鼠标效果卡片 ────────────────────────────────────────────────────────
function CursorCard({
  effect,
  onDelete,
  onUpdate,
}: {
  effect: AdminCursorEffect
  onDelete: (id: number) => void
  onUpdate: (id: number, data: Partial<AdminCursorEffect>) => void
}) {
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({
    name: effect.name,
    description: effect.description ?? '',
    price: effect.price,
    rarity: effect.rarity,
    scale: effect.scale,
    follow_easing: effect.follow_easing,
    emoji: effect.emoji,
    sprite_url: effect.sprite_url ?? '',
    poster_url: effect.poster_url ?? '',
    render_type: effect.render_type,
    enabled: effect.enabled,
  })
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [imgError, setImgError] = useState(false)

  // 同步外部更新
  useEffect(() => {
    if (!editing) {
      setForm({
        name: effect.name,
        description: effect.description ?? '',
        price: effect.price,
        rarity: effect.rarity,
        scale: effect.scale,
        follow_easing: effect.follow_easing,
        emoji: effect.emoji,
        sprite_url: effect.sprite_url ?? '',
        poster_url: effect.poster_url ?? '',
        render_type: effect.render_type,
        enabled: effect.enabled,
      })
    }
  }, [effect, editing])

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/shop/cursors/${effect.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          description: form.description || null,
          price: Number(form.price),
          rarity: form.rarity,
          scale: Number(form.scale),
          follow_easing: Number(form.follow_easing),
          emoji: form.emoji,
          sprite_url: form.sprite_url || null,
          poster_url: form.poster_url || null,
          render_type: form.render_type,
          enabled: form.enabled,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || '保存失败')
      onUpdate(effect.id, data.effect)
      setEditing(false)
    } catch (err) {
      alert(err instanceof Error ? err.message : '保存失败')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!confirm(`确认删除「${effect.name}」？\n\n已购买该效果的用户记录会一并清除，此操作不可撤销。`)) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/shop/cursors/${effect.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || '删除失败')
      }
      onDelete(effect.id)
    } catch (err) {
      alert(err instanceof Error ? err.message : '删除失败')
    } finally {
      setDeleting(false)
    }
  }

  const rarityCfg = RARITY_OPTIONS.find(r => r.value === effect.rarity)

  return (
    <div className={`group bg-white border rounded-2xl overflow-hidden transition-all duration-200 ${
      effect.enabled ? 'border-gray-100 hover:border-gray-200 hover:shadow-md' : 'border-gray-100 opacity-60'
    }`}>
      {/* 顶部：预览 + 基本信息 */}
      <div className="flex gap-4 p-4">
        {/* 预览：优先 poster_url 静态图，其次 GIF，最后 emoji 兜底 */}
        <div className="flex-shrink-0 w-20 h-20 flex items-center justify-center bg-slate-50 rounded-xl">
          {(() => {
            const posterSrc = form.poster_url
            const gifSrc = form.render_type === 'gif' ? form.sprite_url : null
            const imgSrc = !imgError ? (posterSrc || gifSrc) : null
            if (imgSrc) {
              return (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={imgSrc}
                  alt={form.name}
                  className="max-w-full max-h-full object-contain"
                  onError={() => setImgError(true)}
                />
              )
            }
            return (
              <div className="flex flex-col items-center gap-1 text-gray-400">
                {imgError && (form.sprite_url || form.poster_url) ? (
                  <ImageOff className="w-6 h-6 text-gray-300" />
                ) : (
                  <span
                    className="leading-none"
                    style={{ fontSize: 40, animation: 'cursor-admin-bob 1.6s ease-in-out infinite' }}
                  >
                    {form.emoji || '👻'}
                  </span>
                )}
                {form.render_type === 'sprite_sheet' && (
                  <span className="text-[9px] font-mono text-gray-300">sprite</span>
                )}
                <style>{`@keyframes cursor-admin-bob { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-3px)} }`}</style>
              </div>
            )
          })()}
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
                <h3 className="text-sm font-black text-gray-900">{effect.name}</h3>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${rarityCfg?.color}`}>
                  {rarityCfg?.label}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                  effect.render_type === 'gif'
                    ? 'bg-emerald-100 text-emerald-600'
                    : 'bg-cyan-100 text-cyan-600'
                }`}>
                  {effect.render_type === 'gif' ? 'GIF' : 'SPRITE'}
                </span>
                {!effect.enabled && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-red-100 text-red-600">
                    已禁用
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">
                {effect.description || <span className="italic">无描述</span>}
              </p>
              <div className="flex items-center gap-3 mt-1.5 text-xs">
                <span className="flex items-center gap-1 font-bold text-gray-700">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  {effect.price}
                </span>
                <span className="text-gray-400 font-mono">{effect.key}</span>
              </div>
            </>
          )}
        </div>

        {/* 操作按钮 */}
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

      {/* 编辑表单 */}
      {editing && (
        <div className="border-t border-gray-100 px-4 py-3 space-y-3 bg-slate-50/50">
          {/* sprite_url + 上传 */}
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1 block">
              素材 URL {form.render_type === 'gif' && '（GIF 路径）'}
            </label>
            <div className="flex gap-2">
              <input
                value={form.sprite_url}
                onChange={e => { setForm(f => ({ ...f, sprite_url: e.target.value })); setImgError(false) }}
                placeholder={form.render_type === 'gif' ? '/cursor-effects/xxx.gif' : '/cursor-effects/xxx.webp'}
                className="flex-1 text-xs font-mono border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-400"
              />
              {form.render_type === 'gif' && (
                <GifUploadButton
                  onUploaded={(url, filename) => {
                    // 用上传后的文件名（去扩展名）作为 key 建议
                    setForm(f => ({ ...f, sprite_url: url }))
                    setImgError(false)
                  }}
                />
              )}
            </div>
          </div>

          {/* poster_url（静态预览图，sprite_sheet 模式必填，GIF 模式可留空） */}
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1 block">
              静态预览图 URL {form.render_type === 'sprite_sheet' && '（poster，商城/管理页展示用）'}
            </label>
            <input
              value={form.poster_url}
              onChange={e => { setForm(f => ({ ...f, poster_url: e.target.value })); setImgError(false) }}
              placeholder="/cursor-effects/xxx-poster.webp"
              className="w-full text-xs font-mono border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-400"
            />
            <p className="text-[10px] text-gray-400 mt-1">
              sprite_sheet 模式：填源站 poster.webp 路径（可用 <code className="bg-gray-100 px-1 rounded">node scripts/fetch-cursor-posters.mjs</code> 自动拉取）
            </p>
          </div>

          {/* 渲染类型 */}
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1 block">
              渲染类型
            </label>
            <div className="flex gap-1.5">
              {RENDER_TYPE_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, render_type: opt.value }))}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all"
                  style={
                    form.render_type === opt.value
                      ? { background: '#2563eb', color: '#fff' }
                      : { background: '#f1f5f9', color: '#64748b' }
                  }
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* 价格 + 稀有度 */}
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
                onChange={e => setForm(f => ({ ...f, rarity: e.target.value as AdminCursorEffect['rarity'] }))}
                className="w-full text-sm font-bold border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-400 bg-white"
              >
                {RARITY_OPTIONS.map(r => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* scale + follow_easing + emoji */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1 block">尺寸 scale</label>
              <input
                type="number"
                value={form.scale}
                onChange={e => setForm(f => ({ ...f, scale: Number(e.target.value) }))}
                min={32}
                max={200}
                className="w-full text-sm border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-400"
              />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1 block">跟随系数</label>
              <input
                type="number"
                value={form.follow_easing}
                onChange={e => setForm(f => ({ ...f, follow_easing: Number(e.target.value) }))}
                min={0.05}
                max={0.3}
                step={0.01}
                className="w-full text-sm border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-400"
              />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1 block">Emoji 兜底</label>
              <input
                value={form.emoji}
                onChange={e => setForm(f => ({ ...f, emoji: e.target.value }))}
                maxLength={4}
                className="w-full text-sm border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-400"
              />
            </div>
          </div>

          {/* 启用开关 */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.enabled}
              onChange={e => setForm(f => ({ ...f, enabled: e.target.checked }))}
              className="w-4 h-4 rounded accent-blue-600"
            />
            <span className="text-xs font-bold text-gray-700">启用（取消则商城不展示）</span>
          </label>

          {/* 保存 / 取消 */}
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

// ─── GIF 上传按钮 ────────────────────────────────────────────────────────────
function GifUploadButton({ onUploaded }: { onUploaded: (url: string, filename: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  async function handleFile(file: File | undefined) {
    if (!file) return
    if (!file.name.toLowerCase().endsWith('.gif') && file.type !== 'image/gif') {
      alert('仅支持 .gif 文件')
      return
    }
    // 用文件名（去扩展名）作为 key 建议
    const suggestedKey = file.name.replace(/\.gif$/i, '').toLowerCase().replace(/[^a-z0-9-]/g, '-')
    const key = prompt('请输入该 GIF 的 key（小写字母/数字/连字符，将作为文件名和唯一标识）', suggestedKey)
    if (!key) return

    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('key', key)
      const res = await fetch('/api/admin/shop/cursors/upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || '上传失败')
      onUploaded(data.url, data.filename)
    } catch (err) {
      alert(err instanceof Error ? err.message : '上传失败')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/gif,.gif"
        className="hidden"
        onChange={e => handleFile(e.target.files?.[0])}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-60 whitespace-nowrap"
      >
        {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
        上传 GIF
      </button>
    </>
  )
}

// ─── 新建表单 ────────────────────────────────────────────────────────────────
function NewCursorForm({ onCreated }: { onCreated: (effect: AdminCursorEffect) => void }) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ ...DEFAULT_NEW_CURSOR })
  const [creating, setCreating] = useState(false)

  async function handleCreate() {
    if (!form.key || !form.name) {
      alert('key 和名称必填')
      return
    }
    if (!/^[a-z0-9-]+$/.test(form.key)) {
      alert('key 只能包含小写字母、数字、连字符')
      return
    }
    if (!form.sprite_url) {
      alert('请填写素材 URL（或上传 GIF 后自动填入）')
      return
    }
    setCreating(true)
    try {
      const res = await fetch('/api/admin/shop/cursors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: form.key,
          name: form.name,
          description: form.description || null,
          price: Number(form.price),
          rarity: form.rarity,
          sprite_url: form.sprite_url || null,
          poster_url: form.poster_url || null,
          scale: Number(form.scale),
          follow_easing: Number(form.follow_easing),
          emoji: form.emoji,
          render_type: form.render_type,
          enabled: form.enabled,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || '创建失败')
      onCreated(data.effect)
      setForm({ ...DEFAULT_NEW_CURSOR })
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
        新增鼠标效果
      </button>
    )
  }

  return (
    <div className="bg-white border border-blue-200 rounded-2xl p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-black text-gray-900">新增鼠标效果</h3>
        <button
          onClick={() => setOpen(false)}
          className="text-gray-400 hover:text-gray-600 p-1"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* key + name */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1 block">key（唯一）</label>
          <input
            value={form.key}
            onChange={e => setForm(f => ({ ...f, key: e.target.value.toLowerCase() }))}
            placeholder="如 my-pet"
            className="w-full text-sm font-mono border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-400"
          />
        </div>
        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1 block">名称</label>
          <input
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="如 我的宠物"
            className="w-full text-sm font-bold border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-400"
          />
        </div>
      </div>

      {/* description */}
      <div>
        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1 block">描述</label>
        <input
          value={form.description}
          onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          placeholder="简短描述（可选）"
          className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-400"
        />
      </div>

      {/* 渲染类型 */}
      <div>
        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1 block">渲染类型</label>
        <div className="flex gap-1.5">
          {RENDER_TYPE_OPTIONS.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setForm(f => ({ ...f, render_type: opt.value }))}
              className="px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all"
              style={
                form.render_type === opt.value
                  ? { background: '#2563eb', color: '#fff' }
                  : { background: '#f1f5f9', color: '#64748b' }
              }
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* sprite_url + 上传 */}
      <div>
        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1 block">
          素材 URL {form.render_type === 'gif' && '（GIF 路径）'}
        </label>
        <div className="flex gap-2">
          <input
            value={form.sprite_url}
            onChange={e => setForm(f => ({ ...f, sprite_url: e.target.value }))}
            placeholder={form.render_type === 'gif' ? '/cursor-effects/xxx.gif' : '/cursor-effects/xxx.webp'}
            className="flex-1 text-xs font-mono border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-400"
          />
          {form.render_type === 'gif' && (
            <GifUploadButton
              onUploaded={(url) => {
                // 用上传后的文件名（去扩展名）作为 key 建议
                const suggestedKey = url.split('/').pop()?.replace(/\.gif$/i, '') ?? ''
                setForm(f => ({ ...f, sprite_url: url, key: f.key || suggestedKey }))
              }}
            />
          )}
        </div>
        <p className="text-[10px] text-gray-400 mt-1">
          {form.render_type === 'gif'
            ? 'GIF 模式：上传后自动填入 URL，也可手动填写已有路径'
            : 'Sprite-Sheet 模式：需手动填写 webp 路径（8列×9行，1536×1872）'}
        </p>
      </div>

      {/* poster_url（静态预览图） */}
      <div>
        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1 block">
          静态预览图 URL {form.render_type === 'sprite_sheet' && '（poster，商城/管理页展示用）'}
        </label>
        <input
          value={form.poster_url}
          onChange={e => setForm(f => ({ ...f, poster_url: e.target.value }))}
          placeholder="/cursor-effects/xxx-poster.webp"
          className="w-full text-xs font-mono border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-400"
        />
        <p className="text-[10px] text-gray-400 mt-1">
          {form.render_type === 'sprite_sheet'
            ? 'sprite_sheet 模式必填：填源站 poster.webp 路径'
            : 'GIF 模式可留空：直接用 GIF 自播放作为预览'}
        </p>
      </div>

      {/* 价格 + 稀有度 + scale + easing */}
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
            onChange={e => setForm(f => ({ ...f, rarity: e.target.value as AdminCursorEffect['rarity'] }))}
            className="w-full text-sm font-bold border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-400 bg-white"
          >
            {RARITY_OPTIONS.map(r => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1 block">尺寸 scale</label>
          <input
            type="number"
            value={form.scale}
            onChange={e => setForm(f => ({ ...f, scale: Number(e.target.value) }))}
            min={32}
            max={200}
            className="w-full text-sm border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-400"
          />
        </div>
        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1 block">跟随系数</label>
          <input
            type="number"
            value={form.follow_easing}
            onChange={e => setForm(f => ({ ...f, follow_easing: Number(e.target.value) }))}
            min={0.05}
            max={0.3}
            step={0.01}
            className="w-full text-sm border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-400"
          />
        </div>
        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1 block">Emoji 兜底</label>
          <input
            value={form.emoji}
            onChange={e => setForm(f => ({ ...f, emoji: e.target.value }))}
            maxLength={4}
            className="w-full text-sm border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-400"
          />
        </div>
      </div>

      {/* 提交 */}
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
export default function CursorAdmin() {
  const [effects, setEffects] = useState<AdminCursorEffect[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    fetch('/api/admin/shop/cursors')
      .then(async r => {
        const data = await r.json()
        if (!r.ok) throw new Error(data?.error || `HTTP ${r.status}`)
        return data
      })
      .then(data => {
        setEffects(Array.isArray(data.effects) ? data.effects : [])
        setLoading(false)
      })
      .catch(err => {
        console.error('[cursor admin load]', err)
        setLoadError(String(err))
        setLoading(false)
      })
  }, [])

  function handleCreated(effect: AdminCursorEffect) {
    setEffects(prev => [effect, ...prev])
  }

  function handleUpdate(id: number, data: Partial<AdminCursorEffect>) {
    setEffects(prev => prev.map(e => e.id === id ? { ...e, ...data } as AdminCursorEffect : e))
  }

  function handleDelete(id: number) {
    setEffects(prev => prev.filter(e => e.id !== id))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-gray-300">
        <Loader2 className="w-8 h-8 animate-spin" />
        <span className="ml-3 text-sm font-medium">正在读取鼠标效果…</span>
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
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-400">
          共 {effects.length} 款鼠标效果
          <span className="ml-3 text-gray-300">|</span>
          <span className="ml-3">GIF: {effects.filter(e => e.render_type === 'gif').length}</span>
          <span className="ml-3 text-gray-300">|</span>
          <span className="ml-3">Sprite-Sheet: {effects.filter(e => e.render_type === 'sprite_sheet').length}</span>
        </p>
      </div>

      <NewCursorForm onCreated={handleCreated} />

      {effects.length === 0 ? (
        <div className="text-center py-20 text-gray-300">
          <Gift className="w-12 h-12 mx-auto mb-4" />
          <p className="font-bold">还没有鼠标效果，点击上方按钮新增</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {effects.map(effect => (
            <CursorCard
              key={effect.id}
              effect={effect}
              onDelete={handleDelete}
              onUpdate={handleUpdate}
            />
          ))}
        </div>
      )}
    </div>
  )
}
