'use client'

// 宠物光标导入器 —— 3 个 tab：URL 导入 / 在线浏览 / 现有效果
import { useEffect, useState } from 'react'
import {
  Download, Link2, Search, Grid3X3, List, CheckCircle2, XCircle,
  Loader2, Sparkles, AlertCircle, ArrowRight, Trash2, Pencil, ExternalLink,
} from 'lucide-react'
import type { AdminCursorEffect } from './types'

interface CodexPet {
  id: string
  displayName: string
  description: string
  tags: string[]
  spritesheetUrl: string | null
  posterUrl: string | null
  previewUrl: string | null
  cellSize: string | null
  viewCount: number
  likeCount: number
  kind: string
  hasSpritesheet?: boolean
  hasPoster?: boolean
  ownerHandle?: string
  ownerName?: string
  ownerAvatarUrl?: string | null
}

interface BrowseResponse {
  pets: CodexPet[]
  total: number
  totalPages: number
  page: number
  pageSize: number
}

interface ImportResult {
  mode: 'insert' | 'update'
  dbId: number
  key: string
  name: string
  spriteUrl: string
  posterUrl: string | null
  spriteBytes: number
  posterBytes: number
  frameWidth: number
  frameHeight: number
}

type Tab = 'import' | 'browse' | 'existing'

export default function PetImporter() {
  const [tab, setTab] = useState<Tab>('import')

  return (
    <div className="space-y-6">
      {/* 顶部 Tab 切换 */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-2xl max-w-xl">
        <TabButton active={tab === 'import'} onClick={() => setTab('import')}
          icon={<Link2 className="w-3.5 h-3.5" />} label="URL 导入" />
        <TabButton active={tab === 'browse'} onClick={() => setTab('browse')}
          icon={<Grid3X3 className="w-3.5 h-3.5" />} label="在线浏览" />
        <TabButton active={tab === 'existing'} onClick={() => setTab('existing')}
          icon={<List className="w-3.5 h-3.5" />} label="现有效果" />
      </div>

      {tab === 'import' && <ImportPanel />}
      {tab === 'browse' && <BrowsePanel />}
      {tab === 'existing' && <ExistingPanel />}
    </div>
  )
}

// ─── Tab 按钮 ────────────────────────────────────────────────────────────────
function TabButton({ active, onClick, icon, label }: {
  active: boolean; onClick: () => void; icon: React.ReactNode; label: string
}) {
  return (
    <button onClick={onClick} className={
      `flex-1 flex items-center justify-center gap-1.5 text-sm font-bold py-2.5 rounded-xl transition-all ${
        active ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'
      }`
    }>
      {icon}{label}
    </button>
  )
}

// ─── Tab 1: URL 导入 ─────────────────────────────────────────────────────────
function ImportPanel() {
  const [url, setUrl] = useState('')
  const [price, setPrice] = useState(300)
  const [rarity, setRarity] = useState<'common' | 'rare' | 'epic' | 'legendary'>('common')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleImport(e?: React.FormEvent) {
    e?.preventDefault()
    if (!url.trim()) return
    setLoading(true); setError(null); setResult(null)
    try {
      const res = await fetch('/api/admin/shop/pets/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim(), price, rarity }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || '导入失败')
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : '未知错误')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-5">
      {/* URL 输入卡片 */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
            <Download className="w-4 h-4 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-black text-gray-900">一键导入</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              粘贴 codex-pets.net 链接或直接输入宠物 key，自动下载 sprite 与 poster 并写入数据库
            </p>
          </div>
        </div>

        <form onSubmit={handleImport} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-600 mb-1.5 block">URL / Key</label>
            <input
              type="text" value={url} onChange={e => setUrl(e.target.value)}
              placeholder="例：https://codex-pets.net/pets/cthulhu 或直接 cthulhu"
              className="w-full px-4 py-3 text-sm bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-400 transition-colors font-mono"
              disabled={loading}
            />
            <div className="text-[11px] text-gray-400 mt-1.5 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              支持格式：完整 URL · /pets/key · 纯 key 文本
            </div>
          </div>

          <div className="flex gap-4 items-end flex-wrap">
            <div>
              <label className="text-xs font-bold text-gray-600 mb-1.5 block">价格</label>
              <input
                type="number" min={0} value={price}
                onChange={e => setPrice(parseInt(e.target.value) || 0)}
                className="w-28 px-4 py-3 text-sm bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:border-blue-400 transition-colors font-mono"
                disabled={loading}
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-600 mb-1.5 block">稀有度</label>
              <select
                value={rarity} onChange={e => setRarity(e.target.value as any)}
                className="px-4 py-3 text-sm bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:border-blue-400 transition-colors"
                disabled={loading}
              >
                <option value="common">Common</option>
                <option value="rare">Rare</option>
                <option value="epic">Epic</option>
                <option value="legendary">Legendary</option>
              </select>
            </div>
            <button
              type="submit" disabled={loading || !url.trim()}
              className="flex-1 min-w-[160px] flex items-center justify-center gap-2 py-3 px-5 bg-gradient-to-br from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md shadow-blue-500/20"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              {loading ? '导入中…' : '导入'}
            </button>
          </div>
        </form>
      </div>

      {/* 结果提示 */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3">
          <XCircle className="w-4 h-4 text-red-500 mt-0.5" />
          <div className="flex-1">
            <div className="text-sm font-bold text-red-700 mb-1">导入失败</div>
            <div className="text-xs text-red-600">{error}</div>
          </div>
        </div>
      )}
      {result && <ImportResultCard result={result} />}
    </div>
  )
}

function ImportResultCard({ result }: { result: ImportResult }) {
  const isUpdate = result.mode === 'update'
  return (
    <div className="bg-white border border-green-100 rounded-2xl p-6 shadow-sm">
      <div className="flex items-start gap-3 mb-4">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
          isUpdate ? 'bg-amber-50' : 'bg-green-50'
        }`}>
          {isUpdate
            ? <Sparkles className="w-4 h-4 text-amber-600" />
            : <CheckCircle2 className="w-4 h-4 text-green-600" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-black text-gray-900">
              {isUpdate ? '更新成功' : '新增成功'}
            </h3>
            <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
              isUpdate ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'
            }`}>
              {isUpdate ? 'update' : 'insert'}
            </span>
          </div>
          <div className="text-xs text-gray-500 mt-1 font-mono">
            key: {result.key} · name: {result.name} · DB id: {result.dbId}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <InfoBox label="Sprite" value={`${(result.spriteBytes / 1024).toFixed(1)} KB`} hint={result.spriteUrl} />
        <InfoBox label="Poster" value={result.posterBytes ? `${(result.posterBytes / 1024).toFixed(1)} KB` : '无'} hint={result.posterUrl || '-'} />
        <InfoBox label="帧尺寸" value={`${result.frameWidth} × ${result.frameHeight}`} />
        <InfoBox label="渲染" value="8 × 9 · 10 fps" />
      </div>

      {/* 预览 */}
      <div className="flex gap-4 items-start">
        <div className="flex-shrink-0 w-24 h-24 rounded-xl bg-gray-50 border border-gray-100 overflow-hidden flex items-center justify-center">
          {result.spriteUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={result.spriteUrl} alt={result.name} className="w-full h-full object-contain" />
          )}
        </div>
        {result.posterUrl && (
          <div className="flex-shrink-0 w-24 h-24 rounded-xl bg-gray-50 border border-gray-100 overflow-hidden flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={result.posterUrl} alt={result.name} className="w-full h-full object-contain" />
          </div>
        )}
        <div className="flex-1 text-xs text-gray-500 leading-relaxed">
          <p className="font-bold text-gray-700 mb-2">接下来</p>
          <ul className="space-y-1 list-disc list-inside">
            <li>去 <span className="text-gray-700 font-mono">'现有效果'</span> tab 查看并微调</li>
            <li>访问 <span className="text-gray-700 font-mono">/shop</span> 页面看商城展示</li>
            <li>可以在 <span className="text-gray-700 font-mono">CursorFollower</span> 预览实际跟随效果</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

function InfoBox({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
      <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">{label}</div>
      <div className="text-sm font-bold text-gray-900">{value}</div>
      {hint && <div className="text-[10px] text-gray-400 mt-1 font-mono truncate">{hint}</div>}
    </div>
  )
}

// ─── Tab 2: 在线浏览 ─────────────────────────────────────────────────────────

// 简单的客户端缓存：key = `${page}:${search}`，避免来回翻页重复请求
const browseCache = new Map<string, BrowseResponse>()

function BrowsePanel() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [data, setData] = useState<BrowseResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [importing, setImporting] = useState<string | null>(null)
  const [lastImported, setLastImported] = useState<{ key: string; ok: boolean; msg?: string } | null>(null)
  const [toast, setToast] = useState<{ ok: boolean; msg: string; name?: string } | null>(null)
  const [jumpPage, setJumpPage] = useState('')

  // 搜索防抖
  useEffect(() => {
    const t = setTimeout(() => { setPage(1); load(1, search) }, 400)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])

  useEffect(() => { load(page, search) /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [page])

  async function load(p: number, q: string) {
    const cacheKey = `${p}:${q}`
    // 命中缓存直接用，不显示 loading
    const cached = browseCache.get(cacheKey)
    if (cached) { setData(cached); setError(null); return }

    setLoading(true); setError(null)
    try {
      const url = `/api/admin/shop/pets/browse?page=${p}&pageSize=15${q ? `&search=${encodeURIComponent(q)}` : ''}`
      const res = await fetch(url)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || '加载失败')
      setData(json)
      browseCache.set(cacheKey, json)
    } catch (err) {
      setError(err instanceof Error ? err.message : '未知错误')
    } finally {
      setLoading(false)
    }
  }

  async function handleImport(pet: CodexPet) {
    setImporting(pet.id); setLastImported(null)
    try {
      const res = await fetch('/api/admin/shop/pets/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: pet.id, price: 300, rarity: 'common' }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || '导入失败')
      const msg = json.mode === 'update' ? '已更新' : '已新增'
      setLastImported({ key: pet.id, ok: true, msg })
      // 显示成功 toast
      setToast({ ok: true, msg, name: pet.displayName || pet.id })
      setTimeout(() => setToast(null), 3500)
      // 导入成功后清除现有效果的缓存（ExistingPanel 会重新拉取）
      browseCache.clear()
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : '失败'
      setLastImported({ key: pet.id, ok: false, msg: errMsg })
      setToast({ ok: false, msg: errMsg, name: pet.displayName || pet.id })
      setTimeout(() => setToast(null), 3500)
    } finally {
      setImporting(null)
      setTimeout(() => setLastImported(curr => curr?.key === pet.id ? null : curr), 3000)
    }
  }

  const totalPages = Math.min(data?.totalPages || 1, 50)

  function handleJump() {
    const n = parseInt(jumpPage)
    if (isNaN(n) || n < 1 || n > totalPages) return
    setPage(n)
    setJumpPage('')
  }

  return (
    <div className="space-y-4">
      {/* 成功/失败 弹窗 */}
      {toast && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setToast(null)}>
          <div
            className={`bg-white rounded-3xl shadow-2xl border-2 max-w-sm w-full mx-4 p-8 text-center animate-in zoom-in-95 duration-300 ${
              toast.ok ? 'border-green-200' : 'border-red-200'
            }`}
            onClick={e => e.stopPropagation()}
          >
            <div className={`w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center ${
              toast.ok ? 'bg-green-100' : 'bg-red-100'
            }`}>
              {toast.ok
                ? <CheckCircle2 className="w-9 h-9 text-green-600" />
                : <XCircle className="w-9 h-9 text-red-500" />}
            </div>
            <h3 className={`text-lg font-black mb-1 ${toast.ok ? 'text-green-700' : 'text-red-700'}`}>
              {toast.ok ? '导入成功' : '导入失败'}
            </h3>
            {toast.name && <p className="text-sm font-bold text-gray-900 mb-1">{toast.name}</p>}
            <p className="text-xs text-gray-500">{toast.msg}</p>
            <button
              onClick={() => setToast(null)}
              className={`mt-5 w-full py-2.5 rounded-xl text-sm font-bold text-white transition-colors ${
                toast.ok ? 'bg-green-600 hover:bg-green-500' : 'bg-red-600 hover:bg-red-500'
              }`}
            >
              确定
            </button>
          </div>
        </div>
      )}

      {/* 搜索框 */}
      <div className="flex gap-2 items-center bg-white border border-gray-100 rounded-2xl p-3 shadow-sm">
        <Search className="w-4 h-4 text-gray-400 ml-2" />
        <input
          type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="在 codex-pets 中搜索…（空为浏览全部）"
          className="flex-1 px-2 py-1.5 text-sm bg-transparent text-gray-900 placeholder-gray-400 focus:outline-none font-medium"
        />
        {search && (
          <button onClick={() => setSearch('')}
            className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1 rounded-lg">清空</button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />{error}
        </div>
      )}

      {/* 宠物网格 */}
      {loading && !data ? (
        <div className="flex items-center justify-center py-20 text-gray-400 text-sm">
          <Loader2 className="w-4 h-4 animate-spin mr-2" />加载中…
        </div>
      ) : data && data.pets.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {data.pets.map(pet => (
            <PetCard key={pet.id} pet={pet}
              onImport={() => handleImport(pet)}
              isImporting={importing === pet.id}
              lastResult={lastImported?.key === pet.id ? lastImported : null}
            />
          ))}
        </div>
      ) : data && data.pets.length === 0 ? (
        <div className="text-center py-20 text-gray-400 text-sm">没有找到匹配的宠物</div>
      ) : null}

      {/* 分页 */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 py-4 flex-wrap">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
            className="px-3 py-1.5 text-xs font-bold bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg disabled:opacity-30 transition-colors">
            上一页
          </button>
          {/* 页码按钮组 */}
          {generatePageButtons(page, totalPages).map((p, i) =>
            p === '...' ? (
              <span key={`gap-${i}`} className="text-xs text-gray-300 px-1">…</span>
            ) : (
              <button key={p} onClick={() => setPage(p)}
                className={`w-8 h-8 text-xs font-bold rounded-lg transition-colors ${
                  p === page ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}>
                {p}
              </button>
            )
          )}
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
            className="px-3 py-1.5 text-xs font-bold bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg disabled:opacity-30 transition-colors">
            下一页
          </button>
          {/* 跳转输入 */}
          <div className="flex items-center gap-1 ml-2">
            <span className="text-xs text-gray-400">跳至</span>
            <input
              type="text" value={jumpPage} onChange={e => setJumpPage(e.target.value.replace(/\D/g, ''))}
              onKeyDown={e => { if (e.key === 'Enter') handleJump() }}
              placeholder={String(page)}
              className="w-12 px-2 py-1 text-xs text-center bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-400 font-mono"
            />
            <span className="text-xs text-gray-400">页</span>
            <button onClick={handleJump} disabled={!jumpPage}
              className="px-2 py-1 text-xs font-bold bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg disabled:opacity-30 transition-colors">
              Go
            </button>
          </div>
          <span className="text-xs text-gray-400 font-mono ml-2">
            共 {data.total}
          </span>
        </div>
      )}
    </div>
  )
}

// 生成页码按钮：首页、当前页前后2页、末页，用 ... 填充
function generatePageButtons(current: number, total: number): (number | '...')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const buttons: (number | '...')[] = [1]
  const start = Math.max(2, current - 1)
  const end = Math.min(total - 1, current + 1)
  if (start > 2) buttons.push('...')
  for (let i = start; i <= end; i++) buttons.push(i)
  if (end < total - 1) buttons.push('...')
  buttons.push(total)
  return buttons
}

function PetCard({ pet, onImport, isImporting, lastResult }: {
  pet: CodexPet; onImport: () => void; isImporting: boolean;
  lastResult: { ok: boolean; msg?: string } | null
}) {
  const imgSrc = pet.posterUrl || pet.previewUrl || pet.spritesheetUrl || ''
  const [tagsExpanded, setTagsExpanded] = useState(false)
  const ownerName = pet.ownerName || pet.ownerHandle || ''
  const ownerInitial = ownerName.charAt(0).toUpperCase() || '?'

  return (
    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow group">
      <div className="relative aspect-[4/3] bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
        {imgSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imgSrc} alt={pet.displayName}
            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">无预览</div>
        )}
        {pet.kind && (
          <span className="absolute top-2 left-2 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full bg-white/90 text-gray-600 backdrop-blur">
            {pet.kind}
          </span>
        )}
        {pet.cellSize && (
          <span className="absolute top-2 right-2 text-[10px] font-bold px-2 py-1 rounded-full bg-black/60 text-white font-mono">
            {pet.cellSize}
          </span>
        )}
      </div>

      <div className="p-3">
        <div className="flex items-start justify-between gap-2 mb-1">
          <div className="flex-1 min-w-0">
            <div className="text-sm font-black text-gray-900 truncate">{pet.displayName || pet.id}</div>
            <div className="text-[10px] font-mono text-gray-400 truncate">{pet.id}</div>
          </div>
          {/* 作者头像：ownerAvatarUrl 为 null 时用首字母 fallback */}
          {ownerName && (
            <div className="flex items-center gap-1 flex-shrink-0" title={ownerName}>
              {pet.ownerAvatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={pet.ownerAvatarUrl} alt={ownerName}
                  className="w-5 h-5 rounded-full object-cover ring-1 ring-gray-100"
                  onError={(e) => {
                    const t = e.target as HTMLImageElement
                    t.style.display = 'none'
                    t.nextElementSibling?.classList.remove('hidden')
                  }} />
              ) : null}
              {!pet.ownerAvatarUrl && (
                <span className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 text-white text-[9px] font-black flex items-center justify-center ring-1 ring-gray-100">
                  {ownerInitial}
                </span>
              )}
              {pet.ownerHandle && (
                <span className="text-[9px] text-gray-400 font-mono max-w-[60px] truncate">@{pet.ownerHandle}</span>
              )}
            </div>
          )}
        </div>

        {pet.description && (
          <p className="text-xs text-gray-500 leading-relaxed line-clamp-2 mb-2">
            {pet.description}
          </p>
        )}

        {pet.tags && pet.tags.length > 0 && (
          <div className="mb-3">
            {/* 标签区域：默认限制2行高度，点击展开 */}
            <div
              className={`flex flex-wrap gap-1 overflow-hidden transition-all duration-200 ${
                tagsExpanded ? 'max-h-96' : 'max-h-[44px]'
              }`}
            >
              {pet.tags.map(tag => (
                <span key={tag} className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 whitespace-nowrap">
                  {tag}
                </span>
              ))}
            </div>
            {pet.tags.length > 4 && (
              <button
                onClick={() => setTagsExpanded(v => !v)}
                className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors mt-1"
              >
                {tagsExpanded ? '收起' : `+${pet.tags.length - 4} 更多`}
              </button>
            )}
          </div>
        )}

        <div className="flex items-center gap-2">
          <button onClick={onImport} disabled={isImporting || !pet.hasSpritesheet}
            className="flex-1 flex items-center justify-center gap-1 py-2 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-500 text-white disabled:bg-gray-200 disabled:text-gray-400 transition-colors">
            {isImporting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
            {isImporting ? '导入中' : '导入'}
          </button>
          <a href={`https://codex-pets.net/pets/${pet.id}`} target="_blank" rel="noreferrer"
            className="flex-shrink-0 p-2 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-500 transition-colors">
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        {lastResult && (
          <div className={`mt-2 text-[10px] font-bold text-center py-1 rounded ${
            lastResult.ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}>
            {lastResult.msg}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Tab 3: 现有效果 ─────────────────────────────────────────────────────────

// 现有效果列表缓存，避免每次切换 tab 都重新加载
let existingCache: AdminCursorEffect[] | null = null

function ExistingPanel() {
  const [effects, setEffects] = useState<AdminCursorEffect[] | null>(existingCache)
  const [loading, setLoading] = useState(!existingCache)
  const [error, setError] = useState<string | null>(null)

  async function load(force = false) {
    if (!force && existingCache) { setEffects(existingCache); setLoading(false); return }
    setLoading(true); setError(null)
    try {
      const res = await fetch('/api/admin/shop/cursors')
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || '加载失败')
      existingCache = json.effects || []
      setEffects(existingCache)
    } catch (err) {
      setError(err instanceof Error ? err.message : '未知错误')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  if (loading) return (
    <div className="flex items-center justify-center py-20 text-gray-400 text-sm">
      <Loader2 className="w-4 h-4 animate-spin mr-2" />加载中…
    </div>
  )

  if (error) return (
    <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700 flex items-center gap-2">
      <AlertCircle className="w-4 h-4" />{error}
    </div>
  )

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-500">
          共 <span className="font-black text-gray-900">{effects?.length || 0}</span> 个效果
        </div>
        <button onClick={() => load(true)} className="text-xs text-gray-400 hover:text-blue-600 font-bold transition-colors">
          刷新
        </button>
      </div>

      {effects && effects.length === 0 ? (
        <div className="text-center py-20 text-gray-400 text-sm">
          暂无，去 <span className="text-blue-600 font-bold">在线浏览</span> 添加一些吧 →
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {effects?.map(e => <ExistingCard key={e.id} effect={e} onChanged={() => load(true)} />)}
        </div>
      )}
    </div>
  )
}

function ExistingCard({ effect, onChanged }: { effect: AdminCursorEffect; onChanged: () => void }) {
  const [loading, setLoading] = useState(false)
  const img = effect.poster_url || effect.sprite_url || ''

  async function handleToggle() {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/shop/cursors/${effect.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !effect.enabled }),
      })
      if (!res.ok) throw new Error('更新失败')
      onChanged()
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    if (!confirm(`删除 "${effect.name}"？此操作不可逆`)) return
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/shop/cursors/${effect.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('删除失败')
      onChanged()
    } catch (err) { console.error(err) } finally { setLoading(false) }
  }

  return (
    <div className={`bg-white border rounded-2xl overflow-hidden shadow-sm transition-all ${
      effect.enabled ? 'border-gray-100' : 'border-gray-200 opacity-60'
    }`}>
      <div className="flex gap-3 p-3">
        <div className="flex-shrink-0 w-20 h-20 rounded-xl bg-gray-50 border border-gray-100 overflow-hidden flex items-center justify-center">
          {img ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={img} alt={effect.name} className="w-full h-full object-contain" />
          ) : (
            <span className="text-3xl">{effect.emoji || '👻'}</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <div className="text-sm font-black text-gray-900 truncate">{effect.name}</div>
            <span className="text-[10px] font-mono text-gray-400">#{effect.key}</span>
            <RarityBadge rarity={effect.rarity} />
          </div>
          <div className="text-[11px] text-gray-500 leading-relaxed line-clamp-2 mb-2">
            {effect.description || '无描述'}
          </div>
          <div className="flex items-center gap-2 text-[10px] text-gray-400 font-mono flex-wrap">
            <span>{effect.render_type}</span>
            <span>·</span>
            <span>¥{effect.price}</span>
            <span>·</span>
            <span>{effect.cols}×{effect.rows}</span>
            <span>·</span>
            <span>{effect.fps} fps</span>
            <span>·</span>
            <span>scale {effect.scale}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1 px-3 pb-3 border-t border-gray-50 pt-2">
        <button onClick={handleToggle} disabled={loading}
          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-bold rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-700 disabled:opacity-30 transition-colors">
          {effect.enabled ? <XCircle className="w-3 h-3 text-gray-500" /> : <CheckCircle2 className="w-3 h-3 text-green-600" />}
          {effect.enabled ? '禁用' : '启用'}
        </button>
        <a href={`/shop`}
          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-bold rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 transition-colors">
          <ArrowRight className="w-3 h-3" />查看
        </a>
        <button onClick={handleDelete} disabled={loading}
          className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-red-50 hover:bg-red-100 text-red-700 disabled:opacity-30 transition-colors">
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    </div>
  )
}

function RarityBadge({ rarity }: { rarity: string }) {
  const styles: Record<string, string> = {
    common: 'bg-gray-100 text-gray-600',
    rare: 'bg-blue-100 text-blue-700',
    epic: 'bg-purple-100 text-purple-700',
    legendary: 'bg-amber-100 text-amber-700',
  }
  return (
    <span className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded ${styles[rarity] || styles.common}`}>
      {rarity}
    </span>
  )
}
