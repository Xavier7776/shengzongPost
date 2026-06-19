// 从 codex-pets.net 拉取 cursor_effect 的 sprite sheet 本体
//
// 用法:
//   node scripts/fetch-cursor-sprites.mjs --key cthulhu            # 只拉取指定 key
//   node scripts/fetch-cursor-sprites.mjs --all                    # 全部 sprite_url 为空的记录
//   node scripts/fetch-cursor-sprites.mjs --key cthulhu --insert  # 并作为新记录插入 DB
//   node scripts/fetch-cursor-sprites.mjs --dump cthulhu          # 只输出 API 返回
//
// API: https://codex-pets.net/api/pets?search=<id>
//   每只宠物: { id, displayName, description, spritesheetUrl, posterUrl, previewUrl,
//               tags[], validationReport: { cellSize: "192x208", statesDetected: 9 } }
import fs from 'node:fs'
import path from 'node:path'
import { neon } from '@neondatabase/serverless'
import { writeFile } from 'node:fs/promises'

function parseArgs() {
  const args = process.argv.slice(2)
  const opts = { targetKey: null, doInsert: false, dumpKey: null, doAll: false }
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--key'    && args[i+1]) opts.targetKey = args[++i]
    else if (args[i] === '--dump' && args[i+1]) opts.dumpKey = args[++i]
    else if (args[i] === '--insert') opts.doInsert = true
    else if (args[i] === '--all')    opts.doAll = true
    else if (args[i] === '-h' || args[i] === '--help') { console.log('用法见脚本顶部注释'); process.exit(0) }
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
  // --dump: 调试输出
  if (opts.dumpKey) {
    const pet = await fetchPetById(opts.dumpKey)
    if (!pet) { console.log('未找到:', opts.dumpKey); return }
    console.log(JSON.stringify(pet, null, 2))
    if (pet.validationReport) console.log('\nvalidationReport:', JSON.stringify(pet.validationReport, null, 2))
    return
  }

  // 从 DB 获取待处理记录
  let rows
  if (opts.targetKey) {
    const existing = await sql`SELECT id, key, name, sprite_url FROM cursor_effects WHERE key = ${opts.targetKey} AND render_type = 'sprite_sheet' LIMIT 1`
    if (existing.length > 0) {
      rows = existing
      console.log(`[target] 处理 key=${opts.targetKey}（现有 sprite_url: ${existing[0].sprite_url || '(空)'}）`)
    } else if (opts.doInsert) {
      console.log(`[insert] key=${opts.targetKey} 不存在于 DB，将从 codex-pets 拉取并作为新记录插入`)
      rows = [{ key: opts.targetKey, name: opts.targetKey, __insert: true }]
    } else {
      console.log(`[error] key=${opts.targetKey} 不存在于 DB。如果想插入新记录，加 --insert 参数。`)
      process.exit(1)
    }
  } else if (opts.doAll) {
    rows = await sql`SELECT id, key, name FROM cursor_effects WHERE render_type = 'sprite_sheet' AND (sprite_url IS NULL OR sprite_url = '') ORDER BY id`
    console.log(`[--all] 共 ${rows.length} 个 sprite_url 为空的记录待处理`)
  } else {
    console.log('请使用 --key <name> 指定一个宠物 key，或 --all 处理所有缺 sprite_url 的记录。\n不确定 key 时用 --dump <name> 先看看 API 返回。')
    process.exit(1)
  }

  if (rows.length === 0) { console.log('没有需要处理的记录。'); return }

  let ok = 0, fail = 0
  for (const row of rows) {
    const { key, name } = row
    const isInsert = !!row.__insert
    process.stdout.write(`[${key}] ${name || ''}: `)
    try {
      const pet = await fetchPetById(key)
      if (!pet) throw new Error('codex-pets 中未找到（id 不匹配？）')
      if (!pet.spritesheetUrl) throw new Error('返回无 spritesheetUrl')

      // 下载 sprite 本体
      const destPath = path.join(PUBLIC_DIR, `${key}.webp`)
      const size = await downloadFile(pet.spritesheetUrl, destPath)
      const localUrl = `/cursor-effects/${key}.webp`

      // 从 validationReport.cellSize 解析帧尺寸（默认为 192x208）
      let fw = 192, fh = 208
      const cs = pet.validationReport?.cellSize
      if (cs && /^(\d+)x(\d+)$/.test(cs)) {
        const m = cs.match(/^(\d+)x(\d+)$/)
        fw = parseInt(m[1]); fh = parseInt(m[2])
      }

      if (isInsert) {
        // 作为新记录插入
        const displayName = pet.displayName || pet.name || key
        const desc = pet.description?.slice(0, 200) || ''
        await sql`INSERT INTO cursor_effects (key, name, description, sprite_url, render_type, frame_width, frame_height, cols, rows, fps)
                  VALUES (${key}, ${displayName}, ${desc}, ${localUrl}, 'sprite_sheet', ${fw}, ${fh}, 8, 9, 10)
                  ON CONFLICT (key) DO UPDATE SET sprite_url = ${localUrl}, frame_width = ${fw}, frame_height = ${fh}`
        console.log(`✓ 新增 ${(size/1024).toFixed(1)}KB → ${localUrl}（帧 ${fw}x${fh}）`)
      } else {
        // 更新已有记录的 sprite_url，同时按 API 返回修正帧尺寸
        await sql`UPDATE cursor_effects SET sprite_url = ${localUrl}, frame_width = ${fw}, frame_height = ${fh} WHERE id = ${row.id}`
        console.log(`✓ ${(size/1024).toFixed(1)}KB → ${localUrl}（帧 ${fw}x${fh}）`)
      }
      ok++
    } catch (err) {
      console.log(`✗ ${err.message}`)
      fail++
    }
    await new Promise(r => setTimeout(r, 400))
  }

  console.log(`\n完成: ${ok} 成功, ${fail} 失败`)
}

main().catch(err => { console.error(err); process.exit(1) })
