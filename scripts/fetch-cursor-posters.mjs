// 批量从 codex-pets.net 拉取每个 cursor_effect 的 poster 静态预览图
// 用法: node scripts/fetch-cursor-posters.mjs
//
// 流程:
// 1. 查 cursor_effects 表所有 sprite_sheet 类型的记录
// 2. 对每个 key 调 https://codex-pets.net/api/pets/<key>/share-data
// 3. 从返回 JSON 取 posterUrl
// 4. 下载到 public/cursor-effects/<key>-poster.webp
// 5. 更新 cursor_effects.poster_url = '/cursor-effects/<key>-poster.webp'
import fs from 'node:fs'
import path from 'node:path'
import { neon } from '@neondatabase/serverless'
import { writeFile } from 'node:fs/promises'

const envText = fs.readFileSync(path.join(process.cwd(), '.env.local'), 'utf8')
for (const line of envText.split('\n')) {
  const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/)
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
}
const sql = neon(process.env.DATABASE_URL)

const PUBLIC_DIR = path.join(process.cwd(), 'public', 'cursor-effects')
const API_BASE = 'https://codex-pets.net'

async function fetchJson(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`)
  return res.json()
}

async function downloadFile(url, destPath) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`)
  const buf = Buffer.from(await res.arrayBuffer())
  await writeFile(destPath, buf)
  return buf.length
}

async function main() {
  // 只处理 sprite_sheet 类型（gif 是用户自己上传的，无需拉取）
  const rows = await sql`
    SELECT id, key, name FROM cursor_effects
    WHERE render_type = 'sprite_sheet'
    ORDER BY id
  `
  console.log(`共 ${rows.length} 个 sprite_sheet 宠物，开始拉取 poster...`)

  let ok = 0, fail = 0
  for (const row of rows) {
    const { id, key, name } = row
    process.stdout.write(`[${id}] ${key} (${name}): `)
    try {
      const data = await fetchJson(`${API_BASE}/api/pets/${key}/share-data`)
      const posterUrl = data?.pet?.posterUrl
      if (!posterUrl) throw new Error('share-data 无 posterUrl 字段')

      const destPath = path.join(PUBLIC_DIR, `${key}-poster.webp`)
      const size = await downloadFile(posterUrl, destPath)
      const localUrl = `/cursor-effects/${key}-poster.webp`

      await sql`UPDATE cursor_effects SET poster_url = ${localUrl} WHERE id = ${id}`
      console.log(`✓ ${(size/1024).toFixed(1)}KB → ${localUrl}`)
      ok++
    } catch (err) {
      console.log(`✗ ${err.message}`)
      fail++
    }
    // 礼貌限速，避免压源站
    await new Promise(r => setTimeout(r, 300))
  }

  console.log(`\n完成: ${ok} 成功, ${fail} 失败`)
}

main().catch(err => { console.error(err); process.exit(1) })
