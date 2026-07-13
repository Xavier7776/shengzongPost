// scripts/verify-skills.ts — 快速验证最近插入的 skills 记录
import dotenv from 'dotenv'
import path from 'path'
import { neon } from '@neondatabase/serverless'

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

async function main() {
  const sql = neon(process.env.DATABASE_URL!, { fetchOptions: { cache: 'no-store' as RequestCache } })
  const rows = await sql`
    SELECT name, slug, stars, category, source_url, created_at
    FROM skills
    ORDER BY created_at DESC
    LIMIT 15
  `
  for (const r of rows) {
    console.log(`  ${r.name.padEnd(35)} slug=${r.slug.padEnd(30)} ${String(r.stars).padStart(6)}★  ${r.category.padEnd(12)} ${r.created_at}`)
  }
  console.log(`\nTotal recent: ${rows.length}`)
  
  // Also count total
  const [{count}] = await sql`SELECT COUNT(*)::int as count FROM skills`
  console.log(`Total in DB: ${count}`)
}

main().catch(e => { console.error(e); process.exit(1) })
