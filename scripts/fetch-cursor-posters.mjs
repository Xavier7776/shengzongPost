// 从 codex-pets.net 拉取 cursor_effect 的 poster 静态预览图
//
// 用法:
//   node scripts/fetch-cursor-posters.mjs             # 增量: 只处理 poster_url 为空的
//   node scripts/fetch-cursor-posters.mjs --key astra  # 只拉取指定 key（强制覆盖）
//   node scripts/fetch-cursor-posters.mjs --all        # 全部重新拉取（覆盖已有）
//   node scripts/fetch-cursor-posters.mjs --dump astra # 不下载，仅输出 API 原始返回
//
// API 路径: https://codex-pets.net/api/pets?search=<key>
//   返回结构: { pets: [{ id, displayName, spritesheetUrl, posterUrl, previewUrl, tags, ... }], total, ... }
import fs from 'node:fs'
import path from 'node:path'
import { neon } from '@neondatabase/serverless'
import { writeFile } from 'node:fs/promises'

// ── 参数解析 ──────────────────────────────────────────────────────────────
function parseArgs() {
  const args = process.argv.slice(2)
  const opts = { targetKey: null, forceAll: false, dumpKey: null }
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--key' && args[i+1])      opts.targetKey = args[++i]
    else if (args[i] === '--all')               opts.forceAll = true
    else if (args[i] === '--dump' && args[i+1]) opts.dumpKey = args[++i]
    else if (args[i] === '-h' || args[i] === '--help') {
      console.log('用法见脚本顶部注释')
      process.exit(0)
    }
  }
  return opts
}

const opts = parseArgs()

const envText = fs.readFileSync(path.join(process.cwd(), '.env.local'), 'utf8')
for (const line of envText.split('\n')) {
  const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/)
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
}
const sql = neon(process.env.DATABASE_URL)

const PUBLIC_DIR = path.join(process.cwd(), 'public', 'cursor-effects')
const API_BASE = 'https://codex-pets.net'

// 从 API 搜索单只宠物
async function fetchPetById(id) {
  // 优先直接精确查询：/api/pets/<id>，响应 { pet: { ... } }
  const direct = await fetch(`${API_BASE}/api/pets/${encodeURIComponent(id)}`)
  if (direct.ok) {
    const json = await direct.json()
    const pet = json.pet || json.data || json
    if (pet && (pet.id || pet.key)) return pet
  }
  // 回退到搜索模式
  const res = await fetch(`${API_BASE}/api/pets?search=${encodeURIComponent(id)}&pageSize=50`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const json = await res.json()
  const list = json.pets || json.data || []
  return list.find(p => String(p.id).toLowerCase() === String(id).toLowerCase()) || list[0]
}

async function downloadFile(url, destPath) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`)
  const buf = Buffer.from(await res.arrayBuffer())
  await writeFile(destPath, buf)
  return buf.length
}

async function main() {
  // --dump: 只输出 API 原始返回
  if (opts.dumpKey) {
    const pet = await fetchPetById(opts.dumpKey)
    if (!pet) { console.log('未找到宠物:', opts.dumpKey); return }
    console.log(JSON.stringify(pet, null, 2))
    return
  }

  // 构造 SQL 查询列表
  let rows
  if (opts.targetKey) {
    rows = await sql`SELECT id, key, name FROM cursor_effects WHERE key = ${opts.targetKey} AND render_type = 'sprite_sheet' LIMIT 1`
    console.log(`[target] 只处理 key=${opts.targetKey}`)
  } else if (opts.forceAll) {
    rows = await sql`SELECT id, key, name FROM cursor_effects WHERE render_type = 'sprite_sheet' ORDER BY id`
    console.log(`[--all] 共 ${rows.length} 个宠物，强制全部重新拉取`)
  } else {
    rows = await sql`SELECT id, key, name FROM cursor_effects WHERE render_type = 'sprite_sheet' AND (poster_url IS NULL OR poster_url = '') ORDER BY id`
    console.log(`[incremental] 共 ${rows.length} 个 poster_url 为空的宠物待拉取（加 --all 可强制全部）`)
  }

  if (rows.length === 0) {
    console.log('没有需要处理的记录。')
    return
  }

  let ok = 0, fail = 0, skipped = 0
  for (const row of rows) {
    const { id, key, name } = row
    process.stdout.write(`[${id}] ${key} (${name}): `)
    try {
      const pet = await fetchPetById(key)
      if (!pet) { console.log('✗ API 未找到该宠物（可能 key 与 codex-pets 的 id 不一致）'); fail++; continue }
      if (!pet.posterUrl) { console.log('✗ 返回无 posterUrl'); fail++; continue }

      const destPath = path.join(PUBLIC_DIR, `${key}-poster.webp`)
      const size = await downloadFile(pet.posterUrl, destPath)
      const localUrl = `/cursor-effects/${key}-poster.webp`

      await sql`UPDATE cursor_effects SET poster_url = ${localUrl} WHERE id = ${id}`
      console.log(`✓ ${(size/1024).toFixed(1)}KB → ${localUrl}`)
      ok++
    } catch (err) {
      console.log(`✗ ${err.message}`)
      fail++
    }
    await new Promise(r => setTimeout(r, 300))
  }

  console.log(`\n完成: ${ok} 成功, ${fail} 失败${skipped?', '+skipped+'跳过':''}`)
}

main().catch(err => { console.error(err); process.exit(1) })
