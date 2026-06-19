// POST /api/admin/shop/pets/import — 从 codex-pets URL 解析并导入一只宠物
//
// Body:
//   {
//     "url": "https://codex-pets.net/pets/cthulhu",   // 或任何包含 key 的 URL
//     "key": "cthulhu",                                // 或直接传 key（跳过 URL 解析）
//     "price": 500,                                     // 可选，默认 300
//     "rarity": "rare"                                  // 可选，默认 common
//   }
//
// 流程：
// 1. 从 URL 解析 key 或直接用 body.key
// 2. 调 codex-pets.net/api/pets?search=<key> 拉取元数据
// 3. 下载 sprite sheet → public/cursor-effects/<key>.webp
// 4. 下载 poster → public/cursor-effects/<key>-poster.webp
// 5. 写入 cursor_effects 表（key 已存在则更新 sprite_url/poster_url）
// 6. 返回 { pet: {...}, spriteUrl, posterUrl, dbId, mode: 'insert'|'update' }
import { NextRequest, NextResponse } from 'next/server'
import fs from 'node:fs/promises'
import path from 'node:path'
import { requireAdmin } from '@/lib/auth'
import {
  getAllCursorEffectsAdmin, createCursorEffect, updateCursorEffect,
  type CursorEffectInput,
} from '@/lib/db'

export const dynamic = 'force-dynamic'

const API_BASE = 'https://codex-pets.net'
const PUBLIC_DIR = path.join(process.cwd(), 'public', 'cursor-effects')

// 从 URL 或任意文本中提取宠物 key
// 支持: https://codex-pets.net/pets/KEY, https://codex-pets.net/#/pets/KEY, /pets/KEY, 或纯文本 KEY
function extractKey(input: string): string | null {
  if (!input) return null
  const trimmed = input.trim()
  // 先尝试从 URL 解析（包括 hash 路由 #/pets/KEY）
  try {
    const u = new URL(trimmed.startsWith('http') ? trimmed : 'http://x/' + trimmed.replace(/^\//, ''))
    // 在 pathname 和 hash 中都搜索
    const candidates: string[] = []
    if (u.pathname) candidates.push(u.pathname)
    if (u.hash) candidates.push(u.hash.replace(/^#/, ''))
    const re = /\/(?:pets|pet|api\/pets|api\/pet)\/([a-z0-9-_.]+)/i
    for (const c of candidates) {
      const m = c.match(re)
      if (m) return m[1]
    }
    // 最后一段作为备用
    const last = u.pathname.split('/').filter(Boolean).pop()
    if (last && /^[a-z0-9-_.]+$/i.test(last)) return last
  } catch {
    // 不是 URL，当作纯 key
  }
  // 纯 key 模式
  const clean = trimmed.replace(/\s+/g, '')
  if (/^[a-z0-9-_.]+$/i.test(clean)) return clean
  return null
}

interface CodexPet {
  id: string
  displayName?: string
  description?: string
  spritesheetUrl?: string
  posterUrl?: string
  previewUrl?: string
  tags?: string[]
  validationReport?: {
    atlasSize?: string
    cellSize?: string
    statesDetected?: number
    manifestBytes?: number
    spritesheetBytes?: number
  }
}

async function fetchPetInfo(key: string): Promise<CodexPet> {
  // 优先尝试 /api/pets/<id> 直接精确查询，响应结构 { pet: { id, ... } }
  // 失败时回退到 /api/pets?search=<id> 模糊搜索（在结果中找 id 精确匹配）
  const direct = await fetch(`${API_BASE}/api/pets/${encodeURIComponent(key)}`)
  if (direct.ok) {
    const json = await direct.json()
    const pet = json.pet || json.data || json
    if (pet && (pet.id || pet.key)) {
      return {
        id: pet.id || pet.key || key,
        displayName: pet.displayName,
        description: pet.description,
        spritesheetUrl: pet.spritesheetUrl || pet.spritesheet_url || pet.spriteUrl,
        posterUrl: pet.posterUrl || pet.poster_url || pet.previewUrl,
        previewUrl: pet.previewUrl,
        tags: pet.tags,
        validationReport: pet.validationReport || pet.validation_report,
      }
    }
  }
  // 回退到搜索模式
  const search = await fetch(
    `${API_BASE}/api/pets?search=${encodeURIComponent(key)}&pageSize=50`
  )
  if (!search.ok) throw new Error(`codex-pets API 响应 ${search.status}`)
  const json = await search.json()
  const list: CodexPet[] = json.pets || json.data || []
  const match = list.find(p => String(p.id).toLowerCase() === String(key).toLowerCase())
  if (!match) {
    const sample = list.slice(0, 5).map(p => p.id).join(', ')
    throw new Error(
      `codex-pets.net 中找不到 id="${key}"` +
      (sample ? `。搜索结果里有: ${sample}` : '')
    )
  }
  return match
}

async function downloadToFile(url: string, destPath: string): Promise<number> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`下载失败 ${res.status}: ${url}`)
  const buf = Buffer.from(await res.arrayBuffer())
  // 确保目录存在
  await fs.mkdir(path.dirname(destPath), { recursive: true })
  await fs.writeFile(destPath, buf)
  return buf.length
}

function parseCellSize(cs?: string): { fw: number; fh: number } {
  if (cs && /^(\d+)x(\d+)$/.test(cs)) {
    const m = cs.match(/^(\d+)x(\d+)$/)
    return { fw: parseInt(m![1]), fh: parseInt(m![2]) }
  }
  return { fw: 192, fh: 208 }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin()
    const body = await req.json() as {
      url?: string; key?: string; price?: number; rarity?: string
    }

    const rawKey = body.key || (body.url ? extractKey(body.url) : null)
    if (!rawKey) {
      return NextResponse.json(
        { error: '无法从输入中解析宠物 key，请粘贴 codex-pets.net 链接或直接输入 key' },
        { status: 400 }
      )
    }
    const key = rawKey

    const price = typeof body.price === 'number' && body.price >= 0 ? body.price : 300
    const rarity = ['common', 'rare', 'epic', 'legendary'].includes(body.rarity ?? '')
      ? body.rarity!
      : 'common'

    // 1) 拉元数据
    const pet = await fetchPetInfo(key)
    if (!pet.spritesheetUrl) throw new Error('该宠物没有 sprite sheet 可用')

    // 2) 检查是否已存在
    const existing = await getAllCursorEffectsAdmin()
    const match = existing.find(e => e.key === key)

    // 3) 下载文件
    const spritePath = path.join(PUBLIC_DIR, `${key}.webp`)
    const posterPath = path.join(PUBLIC_DIR, `${key}-poster.webp`)
    const spriteSize = await downloadToFile(pet.spritesheetUrl, spritePath)
    const posterSize = pet.posterUrl ? await downloadToFile(pet.posterUrl, posterPath) : 0

    const localSpriteUrl = `/cursor-effects/${key}.webp`
    const localPosterUrl = posterSize > 0 ? `/cursor-effects/${key}-poster.webp` : null

    const { fw, fh } = parseCellSize(pet.validationReport?.cellSize)
    const name = (pet.displayName || pet.id || key).toString().slice(0, 50)
    const desc = (pet.description || '').toString().slice(0, 200) || null
    const emoji = pet.tags?.[0]?.[0]?.toUpperCase() === '🐱' ? '🐱' : '👻'

    const input: CursorEffectInput = {
      key,
      name,
      description: desc,
      price,
      rarity,
      sprite_url: localSpriteUrl,
      cols: 8,
      rows: 9,
      fps: 10,
      frame_width: fw,
      frame_height: fh,
      scale: 96,
      follow_easing: 0.13,
      state_map: '{"idle":0,"runRight":1,"runLeft":2}',
      emoji,
      render_type: 'sprite_sheet',
      poster_url: localPosterUrl,
      enabled: true,
    }

    let dbId: number
    let mode: 'insert' | 'update'
    if (match) {
      await updateCursorEffect(match.id, input)
      dbId = match.id
      mode = 'update'
    } else {
      const created = await createCursorEffect(input)
      dbId = (created as unknown as { id: number }).id
      mode = 'insert'
    }

    return NextResponse.json({
      mode,
      dbId,
      key,
      name,
      spriteUrl: localSpriteUrl,
      posterUrl: localPosterUrl,
      spriteBytes: spriteSize,
      posterBytes: posterSize,
      frameWidth: fw,
      frameHeight: fh,
      pet: {
        id: pet.id,
        displayName: pet.displayName,
        description: pet.description?.slice(0, 100),
        tags: pet.tags?.slice(0, 5),
        cellSize: pet.validationReport?.cellSize,
        spritesheetBytes: pet.validationReport?.spritesheetBytes,
      },
    })
  } catch (err) {
    console.error('[admin pets import]', err)
    const msg = err instanceof Error ? err.message : '未知错误'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
