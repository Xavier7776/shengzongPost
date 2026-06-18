// 通用迁移应用脚本：node scripts/apply-migration.mjs <migration_file.sql>
import fs from 'node:fs'
import path from 'node:path'
import { neon } from '@neondatabase/serverless'

const file = process.argv[2]
if (!file) { console.error('用法: node scripts/apply-migration.mjs supabase/migrations/xxx.sql'); process.exit(1) }

const mPath = path.join(process.cwd(), file)
const envText = fs.readFileSync(path.join(process.cwd(), '.env.local'), 'utf8')
for (const line of envText.split('\n')) {
  const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/)
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
}
const sql = neon(process.env.DATABASE_URL)

const raw = fs.readFileSync(mPath, 'utf8')
const stmts = raw
  .split(';')
  .map(s => s.split('\n').filter(l => !l.trim().startsWith('--')).join('\n').trim())
  .filter(s => s.length > 0)

console.log(`Parsed ${stmts.length} statements from ${file}`)
let ok = 0, fail = 0
for (const stmt of stmts) {
  try {
    await sql`${sql.unsafe(stmt)}`
    ok++
    console.log('OK:', stmt.split('\n')[0].slice(0, 70))
  } catch (e) {
    fail++
    console.error('FAIL:', e.message, '|', stmt.slice(0, 90).replace(/\n/g, ' '))
  }
}
console.log(`\nApplied ${ok}/${stmts.length} (${fail} failed)`)
