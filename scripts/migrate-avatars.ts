// scripts/migrate-avatars.ts
// 将 Cloudinary 头像 URL 迁移为本地路径占位符
// 运行: npx tsx scripts/migrate-avatars.ts

import { neon } from '@neondatabase/serverless'
import { readFileSync } from 'fs'
import { resolve } from 'path'

// 手动加载 .env.local
try {
  const envFile = readFileSync(resolve(process.cwd(), '.env.local'), 'utf-8')
  for (const line of envFile.split(/\r?\n/)) {
    const match = line.match(/^([^#=]+)=(.*)$/)
    if (match) process.env[match[1].trim()] = match[2].trim()
  }
} catch {}

if (!process.env.DATABASE_URL) {
  console.error('Missing DATABASE_URL')
  process.exit(1)
}

const sql = neon(process.env.DATABASE_URL)

async function main() {
  const rows = await sql`SELECT id, name, avatar FROM users WHERE avatar IS NOT NULL AND avatar LIKE '%cloudinary%'`
  console.log(`找到 ${rows.length} 个 Cloudinary 头像:`)
  for (const row of rows) {
    const r = row as { id: number; name: string; avatar: string }
    console.log(`  - 用户 ${r.id} (${r.name}): ${r.avatar}`)
  }

  if (rows.length === 0) {
    console.log('无需迁移')
    return
  }

  await sql`UPDATE users SET avatar = NULL WHERE avatar IS NOT NULL AND avatar LIKE '%cloudinary%'`
  console.log(`已清除 ${rows.length} 个 Cloudinary 头像 URL，用户需要重新上传头像`)
}

main().catch(console.error)
