// Verify the 9 crawled entries exist in DB
import dotenv from 'dotenv'
import path from 'path'
import { neon } from '@neondatabase/serverless'

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const SLUGS = [
  'andrej-karpathy-skills',
  'scientific-agent-skills',
  'skills',                  // MiniMax-AI/skills
  'ai-research-skills',
  'ai-marketing-skills',
  'skills-by-vuejs-ai',     // vuejs-ai/skills (fixed slug)
  'skillsbench',
  'sc-agent-skills-files',
  'gtm-engineer-skills',
]

async function main() {
  const sql = neon(process.env.DATABASE_URL!, { fetchOptions: { cache: 'no-store' as RequestCache } })
  
  let found = 0
  for (const slug of SLUGS) {
    const rows = await sql`SELECT name, slug, stars, category, source_url, created_at, updated_at FROM skills WHERE slug = ${slug} LIMIT 1`
    if (rows.length > 0) {
      const r = rows[0]
      const age = Math.floor((Date.now() - new Date(r.created_at).getTime()) / 1000 / 60)
      const src = new URL(r.source_url).pathname.slice(1)
      console.log(`  ✓ ${src.padEnd(38)} slug=${r.slug.padEnd(28)} ${String(r.stars).padStart(6)}★  ${r.category}`)
      found++
    } else {
      console.log(`  ✗ ${slug} — NOT FOUND`)
    }
  }
  console.log(`\nFound: ${found}/${SLUGS.length}`)
}

main().catch(e => { console.error(e); process.exit(1) })
