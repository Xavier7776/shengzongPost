'use client'
// app/admin/projects/ProjectsAdminClient.tsx
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Plus, ArrowLeft, Upload, Save, X, Trash2, Edit3, ExternalLink, GripVertical, Paperclip } from 'lucide-react'

interface ProjectAttachment {
  url: string
  filename: string
  size: number
}

interface Project {
  id: number
  slug: string
  name: string
  tagline: string | null
  description: string | null
  content: string | null
  cover_image: string | null
  cover_public_id: string | null
  tech_stack: string[]
  highlights: string[]
  demo_url: string | null
  github_url: string | null
  year: string | null
  sort_order: number
  enabled: boolean
  attachments?: ProjectAttachment[]
  created_at: string
}

// ── 封面上传按钮 ──────────────────────────────────────────────
function CoverUploadButton({
  onUploaded,
  disabled,
}: {
  onUploaded: (url: string, publicId: string) => void
  disabled?: boolean
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/projects/upload', { method: 'POST', body: formData })
      if (!res.ok) throw new Error('上传失败')
      const data = await res.json()
      onUploaded(data.url, data.public_id)
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
        accept="image/*"
        onChange={handleUpload}
        className="hidden"
        disabled={disabled || uploading}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={disabled || uploading}
        className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 px-2 py-1 rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-50"
      >
        <Upload className="w-3 h-3" />
        {uploading ? '上传中…' : '上传'}
      </button>
    </>
  )
}

// ── 项目字段表单（新建与编辑共用） ─────────────────────────────
function ProjectForm({
  initial,
  onSubmit,
  onCancel,
  submitting,
}: {
  initial?: Partial<Project>
  onSubmit: (data: Record<string, unknown>) => Promise<void>
  onCancel: () => void
  submitting: boolean
}) {
  const [form, setForm] = useState({
    slug: initial?.slug ?? '',
    name: initial?.name ?? '',
    tagline: initial?.tagline ?? '',
    description: initial?.description ?? '',
    content: initial?.content ?? '',
    cover_image: initial?.cover_image ?? '',
    cover_public_id: initial?.cover_public_id ?? '',
    tech_stack: (initial?.tech_stack ?? []).join(', '),
    highlights: (initial?.highlights ?? []).join('\n'),
    demo_url: initial?.demo_url ?? '',
    github_url: initial?.github_url ?? '',
    year: initial?.year ?? '',
    sort_order: initial?.sort_order ?? 0,
    enabled: initial?.enabled ?? true,
  })

  // ── 附件 state ─────────────────────────────────────────────
  const [attachments, setAttachments] = useState<ProjectAttachment[]>(initial?.attachments ?? [])
  const [addAttOpen, setAddAttOpen] = useState(false)
  const [addAttFilename, setAddAttFilename] = useState('')
  const [addAttUrl, setAddAttUrl] = useState('')
  const [addAttError, setAddAttError] = useState('')
  const [mdUploading, setMdUploading] = useState(false)

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  // ── 添加外链 ──
  function handleAddAttachment() {
    const filename = addAttFilename.trim()
    const url = addAttUrl.trim()
    setAddAttError('')
    if (!filename) { setAddAttError('请填写文件名'); return }
    if (!url) { setAddAttError('请填写链接'); return }
    if (!/^https?:\/\//i.test(url)) { setAddAttError('链接格式不正确，请以 http(s):// 开头'); return }
    setAttachments(prev => [...prev, { url, filename, size: 0 }])
    setAddAttFilename(''); setAddAttUrl(''); setAddAttOpen(false)
  }

  // ── 上传 md 文件到 Cloudinary ──
  async function handleUploadMd(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (file.size > 10 * 1024 * 1024) { setAddAttError('文件不能超过 10MB'); return }
    setMdUploading(true); setAddAttError('')
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/upload-md', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? '上传失败')
      setAttachments(prev => [...prev, { url: data.url, filename: data.filename, size: data.size }])
    } catch (err) {
      setAddAttError(err instanceof Error ? err.message : '上传失败')
    } finally {
      setMdUploading(false)
    }
  }

  function removeAttachment(index: number) {
    setAttachments(prev => prev.filter((_, i) => i !== index))
  }

  function renameAttachment(index: number, filename: string) {
    setAttachments(prev => prev.map((att, i) => i === index ? { ...att, filename } : att))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.slug.trim() || !form.name.trim()) {
      alert('slug 和名称不能为空')
      return
    }
    await onSubmit({
      slug: form.slug.trim(),
      name: form.name.trim(),
      tagline: form.tagline.trim(),
      description: form.description.trim(),
      content: form.content.trim(),
      cover_image: form.cover_image.trim(),
      cover_public_id: form.cover_public_id.trim(),
      tech_stack: form.tech_stack.split(',').map(s => s.trim()).filter(Boolean),
      highlights: form.highlights.split('\n').map(s => s.trim()).filter(Boolean),
      demo_url: form.demo_url.trim(),
      github_url: form.github_url.trim(),
      year: form.year.trim(),
      sort_order: Number(form.sort_order) || 0,
      enabled: form.enabled,
      attachments,
    })
  }

  const inputCls = 'w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 transition-colors'
  const labelCls = 'block text-[11px] font-bold text-gray-500 mb-1 uppercase tracking-wider'

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-gray-50/50 p-5 rounded-xl border border-gray-100">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Slug（唯一标识）</label>
          <input className={inputCls} value={form.slug} onChange={e => update('slug', e.target.value)} placeholder="my-project" />
        </div>
        <div>
          <label className={labelCls}>项目名称 *</label>
          <input className={inputCls} value={form.name} onChange={e => update('name', e.target.value)} placeholder="我的项目" />
        </div>
      </div>

      <div>
        <label className={labelCls}>副标题 / 定位</label>
        <input className={inputCls} value={form.tagline} onChange={e => update('tagline', e.target.value)} placeholder="一句话描述项目定位" />
      </div>

      <div>
        <label className={labelCls}>
          项目描述
          <span className="ml-2 text-gray-400 font-normal normal-case tracking-normal">
            {form.description.length}/500
          </span>
        </label>
        <textarea
          className={`${inputCls} min-h-[80px] resize-y`}
          value={form.description}
          onChange={e => update('description', e.target.value.slice(0, 500))}
          maxLength={500}
          placeholder="详细描述项目的功能、亮点、解决什么问题（最多 500 字符，完整内容请填到下方 Markdown 介绍）"
        />
      </div>

      <div>
        <label className={labelCls}>项目详细介绍（Markdown）</label>
        <textarea
          className={`${inputCls} min-h-[240px] resize-y font-mono text-xs leading-relaxed`}
          value={form.content}
          onChange={e => update('content', e.target.value)}
          placeholder="# 项目标题&#10;&#10;## 模块一&#10;详细介绍内容，支持 Markdown 语法...&#10;此内容会在 /work/[slug] 详情页渲染"
        />
        <p className="text-[11px] text-gray-400 mt-1">支持 Markdown 语法，详情页 /work/[slug] 用 marked 渲染。留空则详情页只显示简介和亮点。</p>
      </div>

      {/* 封面图 */}
      <div>
        <label className={labelCls}>封面图 URL</label>
        <div className="flex items-center gap-2">
          <input className={inputCls} value={form.cover_image} onChange={e => update('cover_image', e.target.value)} placeholder="https://..." />
          <CoverUploadButton
            onUploaded={(url, publicId) => {
              update('cover_image', url)
              update('cover_public_id', publicId)
            }}
          />
        </div>
        {form.cover_image && (
          <div className="relative mt-2 w-full h-32 rounded-lg overflow-hidden bg-gray-100">
            <Image src={form.cover_image} alt="封面预览" fill sizes="400px" className="object-cover" unoptimized />
          </div>
        )}
      </div>

      <div>
        <label className={labelCls}>技术栈（逗号分隔）</label>
        <input className={inputCls} value={form.tech_stack} onChange={e => update('tech_stack', e.target.value)} placeholder="Next.js, React, PostgreSQL" />
      </div>

      <div>
        <label className={labelCls}>核心亮点（每行一条）</label>
        <textarea className={`${inputCls} min-h-[80px] resize-y`} value={form.highlights} onChange={e => update('highlights', e.target.value)} placeholder={"自研编辑器\nAI 自动评论\nISR 缓存"} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>在线 Demo URL</label>
          <input className={inputCls} value={form.demo_url} onChange={e => update('demo_url', e.target.value)} placeholder="https://demo.example.com" />
        </div>
        <div>
          <label className={labelCls}>GitHub URL</label>
          <input className={inputCls} value={form.github_url} onChange={e => update('github_url', e.target.value)} placeholder="https://github.com/..." />
        </div>
      </div>

      {/* 附件区域：md 上传 + 外链管理（详情页显示下载按钮） */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <label className={labelCls} style={{ marginBottom: 0 }}>
            附件{attachments.length > 0 && `（${attachments.length}）`}
          </label>
          {/* 上传 md 文件按钮 */}
          <label className="flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-700 cursor-pointer">
            <Upload className="w-3 h-3" />
            {mdUploading ? '上传中…' : '上传 md'}
            <input
              type="file"
              accept=".md,text/markdown,text/plain"
              className="hidden"
              onChange={handleUploadMd}
              disabled={mdUploading}
            />
          </label>
          {/* 添加外链按钮 */}
          <button type="button"
            onClick={() => setAddAttOpen(v => !v)}
            className="flex items-center gap-1 text-[11px] font-bold text-orange-600 hover:text-orange-700">
            <Paperclip className="w-3 h-3" />
            {addAttOpen ? '收起外链' : '添加外链'}
          </button>
        </div>

        {addAttOpen && (
          <div className="mb-2 p-3 rounded-xl bg-orange-50 border border-orange-200 space-y-2">
            <p className="text-[11px] font-bold uppercase tracking-wider text-orange-400">添加外部链接</p>
            <div className="flex flex-col gap-2">
              <input
                value={addAttFilename}
                onChange={e => setAddAttFilename(e.target.value)}
                placeholder="文件名，如：论文终稿.pdf"
                className="w-full text-xs text-gray-800 bg-white border border-orange-200 rounded-lg px-3 py-2 focus:outline-none focus:border-orange-400 transition"
              />
              <input
                value={addAttUrl}
                onChange={e => setAddAttUrl(e.target.value)}
                placeholder="链接，如：https://example.com/file.pdf"
                className="w-full text-xs text-gray-800 bg-white border border-orange-200 rounded-lg px-3 py-2 focus:outline-none focus:border-orange-400 transition"
              />
            </div>
            {addAttError && <p className="text-[10px] text-red-500">{addAttError}</p>}
            <div className="flex gap-2 justify-end">
              <button type="button"
                onClick={() => { setAddAttOpen(false); setAddAttError(''); setAddAttFilename(''); setAddAttUrl('') }}
                className="text-xs text-gray-400 hover:text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              >取消</button>
              <button type="button" onClick={handleAddAttachment}
                className="text-xs font-bold text-white bg-orange-500 hover:bg-orange-600 px-3 py-1.5 rounded-lg transition-colors"
              >添加</button>
            </div>
          </div>
        )}

        {attachments.length > 0 && (
          <div className="flex flex-col gap-1.5">
            {attachments.map((att, i) => (
              <div key={i} className="flex items-center gap-2 px-3 py-2 bg-orange-50 border border-orange-200 rounded-xl text-xs text-orange-700">
                <Paperclip className="w-3.5 h-3.5 flex-shrink-0" />
                {/* 文件名（可直接改名） */}
                <input
                  value={att.filename}
                  onChange={e => renameAttachment(i, e.target.value)}
                  className="flex-1 min-w-0 bg-transparent border-b border-transparent hover:border-orange-300 focus:border-orange-400 focus:outline-none text-orange-700 font-medium px-0.5"
                  title="可直接修改文件名"
                />
                {att.size > 0 && (
                  <span className="text-[10px] text-orange-400 flex-shrink-0">
                    {(att.size / 1024).toFixed(1)}KB
                  </span>
                )}
                {/* 外链跳转按钮 */}
                <a
                  href={att.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-[10px] font-bold text-blue-600 hover:text-blue-700 px-1.5 py-0.5 rounded hover:bg-blue-50 flex-shrink-0"
                  title={`在新标签打开：${att.url}`}
                >
                  <ExternalLink className="w-3 h-3" />
                  外链
                </a>
                <button type="button" onClick={() => removeAttachment(i)}
                  className="text-orange-400 hover:text-red-500 flex-shrink-0" title="删除附件">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {attachments.length === 0 && !addAttOpen && (
          <p className="text-[11px] text-gray-400">可上传 md 文件或添加外链，详情页将显示下载按钮。</p>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className={labelCls}>年份</label>
          <input className={inputCls} value={form.year} onChange={e => update('year', e.target.value)} placeholder="2026" />
        </div>
        <div>
          <label className={labelCls}>排序权重</label>
          <input type="number" className={inputCls} value={form.sort_order} onChange={e => update('sort_order', Number(e.target.value))} />
        </div>
        <div className="flex items-end">
          <label className="flex items-center gap-2 text-sm font-bold text-gray-700 cursor-pointer pb-2">
            <input type="checkbox" checked={form.enabled} onChange={e => update('enabled', e.target.checked)} className="w-4 h-4 rounded" />
            启用
          </label>
        </div>
      </div>

      <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
        <button
          type="submit"
          disabled={submitting}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {submitting ? '保存中…' : '保存'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-bold px-4 py-2 rounded-lg transition-colors"
        >
          <X className="w-4 h-4" />
          取消
        </button>
      </div>
    </form>
  )
}

// ── 单条项目卡片（含查看/编辑切换） ───────────────────────────
function ProjectCard({
  project,
  onUpdate,
  onDelete,
}: {
  project: Project
  onUpdate: () => void
  onDelete: () => void
}) {
  const [editing, setEditing] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [toggling, setToggling] = useState(false)

  async function handleSave(data: Record<string, unknown>) {
    setSubmitting(true)
    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: '保存失败' }))
        throw new Error(err.error || '保存失败')
      }
      setEditing(false)
      onUpdate()
    } catch (err) {
      alert(err instanceof Error ? err.message : '保存失败')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete() {
    if (!confirm(`确认删除项目「${project.name}」？此操作不可撤销，封面图也会从 Cloudinary 删除。`)) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/projects/${project.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('删除失败')
      onDelete()
    } catch (err) {
      alert(err instanceof Error ? err.message : '删除失败')
    } finally {
      setDeleting(false)
    }
  }

  async function handleToggle() {
    setToggling(true)
    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !project.enabled }),
      })
      if (!res.ok) throw new Error('切换失败')
      onUpdate()
    } catch (err) {
      alert(err instanceof Error ? err.message : '切换失败')
    } finally {
      setToggling(false)
    }
  }

  if (editing) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <ProjectForm
          initial={project}
          onSubmit={handleSave}
          onCancel={() => setEditing(false)}
          submitting={submitting}
        />
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-4">
        {/* 封面缩略图 */}
        <div className="relative w-24 h-24 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
          {project.cover_image ? (
            <Image src={project.cover_image} alt={project.name} fill sizes="96px" className="object-cover" unoptimized />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">无封面</div>
          )}
        </div>

        {/* 信息 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h3 className="text-base font-black text-gray-900 truncate">{project.name}</h3>
            {!project.enabled && (
              <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded">已隐藏</span>
            )}
            {project.year && (
              <span className="text-[10px] font-bold text-gray-400">{project.year}</span>
            )}
          </div>
          {project.tagline && (
            <p className="text-xs text-blue-600 font-bold mb-1 truncate">{project.tagline}</p>
          )}
          {project.description && (
            <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed mb-2">{project.description}</p>
          )}
          {project.tech_stack.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {project.tech_stack.slice(0, 5).map(t => (
                <span key={t} className="text-[10px] font-bold bg-gray-50 text-gray-500 px-1.5 py-0.5 rounded border border-gray-100">
                  {t}
                </span>
              ))}
              {project.tech_stack.length > 5 && (
                <span className="text-[10px] text-gray-400">+{project.tech_stack.length - 5}</span>
              )}
            </div>
          )}
        </div>

        {/* 操作按钮 */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => setEditing(true)}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500 hover:text-blue-600 transition-colors"
            title="编辑"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button
            onClick={handleToggle}
            disabled={toggling}
            className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${
              project.enabled
                ? 'hover:bg-amber-50 text-gray-500 hover:text-amber-600'
                : 'hover:bg-emerald-50 text-gray-400 hover:text-emerald-600'
            } disabled:opacity-50`}
            title={project.enabled ? '点击隐藏' : '点击启用'}
          >
            <span className="text-xs font-black">{project.enabled ? 'ON' : 'OFF'}</span>
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-600 transition-colors disabled:opacity-50"
            title="删除"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 外链 */}
      {(project.demo_url || project.github_url) && (
        <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-50 text-xs">
          {project.demo_url && (
            <a href={project.demo_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-600 hover:text-blue-700 font-bold">
              <ExternalLink className="w-3 h-3" /> Demo
            </a>
          )}
          {project.github_url && (
            <a href={project.github_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-gray-500 hover:text-gray-700 font-bold">
              GitHub
            </a>
          )}
        </div>
      )}
    </div>
  )
}

// ── 主客户端组件 ───────────────────────────────────────────────
export default function ProjectsAdminClient() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)

  async function fetchProjects() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/projects?admin=1')
      if (!res.ok) throw new Error('加载失败')
      const data = await res.json()
      setProjects(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchProjects() }, [])

  async function handleCreate(data: Record<string, unknown>) {
    setCreating(true)
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: '创建失败' }))
        throw new Error(err.error || '创建失败')
      }
      setShowCreate(false)
      await fetchProjects()
    } catch (err) {
      alert(err instanceof Error ? err.message : '创建失败')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-8 py-5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin"
            className="flex items-center gap-2 text-gray-500 hover:text-gray-900 text-sm font-bold transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            返回
          </Link>
          <div>
            <h1 className="text-xl font-black tracking-tighter text-gray-900">
              个人项目<span className="text-blue-600">.</span>
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">{projects.length} 个项目</p>
          </div>
        </div>
        <button
          onClick={() => setShowCreate(v => !v)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          {showCreate ? '收起新建' : '新建项目'}
        </button>
      </header>

      {/* 主区 */}
      <main className="max-w-4xl mx-auto px-8 py-10 space-y-4">
        {/* 新建表单 */}
        {showCreate && (
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h2 className="text-sm font-black text-gray-900 mb-4 flex items-center gap-2">
              <Plus className="w-4 h-4 text-blue-600" />
              新建项目
            </h2>
            <ProjectForm
              onSubmit={handleCreate}
              onCancel={() => setShowCreate(false)}
              submitting={creating}
            />
          </div>
        )}

        {/* 加载态 */}
        {loading && (
          <div className="text-center py-16 text-gray-400 text-sm">加载中…</div>
        )}

        {/* 错误态 */}
        {error && (
          <div className="text-center py-16">
            <p className="text-red-500 text-sm mb-3">{error}</p>
            <button onClick={fetchProjects} className="text-blue-600 text-sm font-bold">重试</button>
          </div>
        )}

        {/* 空态 */}
        {!loading && !error && projects.length === 0 && !showCreate && (
          <div className="text-center py-20">
            <p className="text-gray-400 text-sm mb-4">还没有项目，点击右上角新建一个吧</p>
          </div>
        )}

        {/* 项目列表 */}
        {!loading && !error && projects.map(p => (
          <ProjectCard
            key={p.id}
            project={p}
            onUpdate={fetchProjects}
            onDelete={fetchProjects}
          />
        ))}
      </main>
    </div>
  )
}
