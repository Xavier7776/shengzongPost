'use client'

// app/admin/gallery/Uploader.tsx
// 上传区：拖拽选图 + 内联上传表单（标题/分类/描述/标签逐张确认）

import { useRef, useState } from 'react'
import { Upload, Loader2 } from 'lucide-react'
import type { PendingFile } from './types'

// ─── 预设分类列表（可自由修改）─────────────────────────────────────────────
const PRESET_CATEGORIES = ['Photo', 'Film', 'Urban', 'Portrait', 'Nature', 'Architecture', 'Travel', 'Abstract']

// ─── 上传区（拖拽选图 + 内联表单）─────────────────────────────────────────

export function UploadZone({ onFiles }: { onFiles: (files: File[]) => void }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  function handleFiles(fileList: FileList | null) {
    if (!fileList) return
    const imgs = Array.from(fileList).filter(f => f.type.startsWith('image/'))
    if (imgs.length) onFiles(imgs)
  }

  return (
    <div
      onDragOver={e => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={e => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files) }}
      onClick={() => inputRef.current?.click()}
      className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all duration-200 select-none
        ${dragging ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}
      `}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={e => handleFiles(e.target.files)}
      />
      <Upload className="w-8 h-8 text-gray-300" />
      <p className="text-sm font-bold text-gray-400">点击或拖拽图片，上传前可设置标题和分类</p>
      <p className="text-xs text-gray-300">支持 JPG、PNG、WEBP，可多选（逐张确认）</p>
    </div>
  )
}

// ─── 内联上传表单（选完图后在 UploadZone 下方展开）──────────────────────────

export function InlineUploadForm({
  pending,
  existingCategories,
  onConfirm,
  onCancel,
}: {
  pending: PendingFile
  existingCategories: string[]
  onConfirm: (title: string, category: string, description: string, tags: string[]) => Promise<void>
  onCancel: () => void
}) {
  const [title, setTitle] = useState(pending.file.name.replace(/\.[^.]+$/, ''))
  const [category, setCategory] = useState('')
  const [customCat, setCustomCat] = useState('')
  const [description, setDescription] = useState('')
  const [tagsRaw, setTagsRaw] = useState('')
  const [uploading, setUploading] = useState(false)

  const allCategories = Array.from(new Set([...existingCategories, ...PRESET_CATEGORIES]))
  const finalCategory = category === '__custom__' ? customCat.trim() : category
  const finalTags = tagsRaw.split(/[,，\s]+/).map(t => t.trim()).filter(Boolean).slice(0, 10)

  async function handleSubmit() {
    if (!finalCategory) return
    setUploading(true)
    await onConfirm(title, finalCategory, description, finalTags)
    setUploading(false)
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
      <div className="flex gap-5 p-5">
        {/* 左：图片预览 */}
        <div className="relative flex-shrink-0 w-40 rounded-xl overflow-hidden bg-gray-100" style={{ height: 120 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={pending.preview} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          <div className="absolute bottom-1.5 left-2 right-2 text-white/60 text-[9px] font-mono truncate">
            {pending.file.name}
          </div>
        </div>

        {/* 右：标题 + 分类 */}
        <div className="flex-1 space-y-3">
          {/* 标题 */}
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1 block">标题</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="输入图片标题"
              autoFocus
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm font-medium text-gray-900 focus:outline-none focus:border-blue-400 transition-colors"
            />
          </div>

          {/* 分类 */}
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1 block">分类</label>
            <div className="flex flex-wrap gap-1.5 mb-1.5">
              {allCategories.map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all"
                  style={
                    category === cat
                      ? { background: '#2563eb', color: '#fff' }
                      : { background: '#f1f5f9', color: '#64748b' }
                  }
                >
                  {cat}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setCategory('__custom__')}
                className="px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all"
                style={
                  category === '__custom__'
                    ? { background: '#2563eb', color: '#fff' }
                    : { background: '#f1f5f9', color: '#64748b' }
                }
              >
                + 自定义
              </button>
            </div>
            {category === '__custom__' && (
              <input
                value={customCat}
                onChange={e => setCustomCat(e.target.value)}
                placeholder="输入自定义分类名"
                autoFocus
                className="w-full border border-blue-300 rounded-xl px-3 py-2 text-sm font-medium text-gray-900 focus:outline-none focus:border-blue-400 transition-colors"
              />
            )}
          </div>

          {/* 描述 */}
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1 block">描述（可选）</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="展示在灯箱信息面板"
              rows={2}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 resize-none focus:outline-none focus:border-blue-400 transition-colors"
            />
          </div>

          {/* 标签 */}
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1 block">标签（可选，逗号分隔）</label>
            <input
              value={tagsRaw}
              onChange={e => setTagsRaw(e.target.value)}
              placeholder="如：夜景, 街拍, 长曝光"
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm font-medium text-gray-900 focus:outline-none focus:border-blue-400 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* 底部操作 */}
      <div className="flex gap-2 px-5 pb-5">
        <button
          onClick={onCancel}
          disabled={uploading}
          className="flex-none px-5 py-2.5 rounded-xl text-sm font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-50"
        >
          取消
        </button>
        <button
          onClick={handleSubmit}
          disabled={uploading || !finalCategory}
          className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {uploading
            ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />上传中…</>
            : <><Upload className="w-3.5 h-3.5" />确认上传</>}
        </button>
      </div>
    </div>
  )
}
