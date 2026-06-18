import fs from 'node:fs'
import path from 'node:path'
import { neon } from '@neondatabase/serverless'
const envText = fs.readFileSync(path.join(process.cwd(), '.env.local'), 'utf8')
for (const line of envText.split('\n')) {
  const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/)
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
}
const sql = neon(process.env.DATABASE_URL)
const rows = await sql`SELECT key, name, price, rarity, scale, sprite_url FROM cursor_effects ORDER BY price`
console.log('DB rows:', rows.length)
for (const r of rows) console.log(`  ${r.price} ${r.rarity} s=${r.scale} ${r.key} | ${r.sprite_url}`)
