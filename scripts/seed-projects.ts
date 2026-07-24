// scripts/seed-projects.ts
// 种子脚本：把 FALLBACK_PROJECTS（含 Mnemo 完整 Markdown 内容）写入 projects 表
// 运行方式：npx tsx scripts/seed-projects.ts
//
// 用途：首次部署迁移后，把本地 fallback 数据持久化到数据库
// 这样后续在后台新建/编辑其他项目时，Mnemo 等已有数据不会"消失"
// 已存在的 slug 会跳过（ON CONFLICT DO NOTHING 语义，通过先查 slug 判断实现）

import dotenv from 'dotenv'
import path from 'path'
import { neon } from '@neondatabase/serverless'
import { FALLBACK_PROJECTS } from '../lib/db-works'

// 加载 .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const DATABASE_URL = process.env.DATABASE_URL
if (!DATABASE_URL) {
  console.error('❌ 缺少 DATABASE_URL 环境变量，请在 .env.local 中配置')
  process.exit(1)
}

const sql = neon(DATABASE_URL)

async function seed() {
  console.log('🌱 开始种子 projects 表...')
  console.log(`   共 ${FALLBACK_PROJECTS.length} 条 fallback 数据`)

  let inserted = 0
  let skipped = 0

  for (const p of FALLBACK_PROJECTS) {
    // 先查 slug 是否已存在，存在则跳过（避免覆盖后台已编辑的数据）
    const existing = await sql`SELECT id FROM projects WHERE slug = ${p.slug}`
    if (existing.length > 0) {
      console.log(`   ⏭️  跳过 "${p.name}" (slug=${p.slug})：已存在`)
      skipped++
      continue
    }

    await sql`
      INSERT INTO projects(
        slug, name, tagline, description, content,
        cover_image, tech_stack, highlights,
        demo_url, github_url, year, sort_order, enabled
      ) VALUES(
        ${p.slug}, ${p.name}, ${p.tagline}, ${p.description},
        ${p.content ?? null},
        ${p.cover}, ${p.techStack}, ${p.highlights},
        ${p.demoUrl ?? null}, ${p.githubUrl ?? null},
        ${p.year}, 0, true
      )
    `
    console.log(`   ✅ 插入 "${p.name}" (slug=${p.slug})${p.content ? ` [含 ${p.content.length} 字 Markdown]` : ''}`)
    inserted++
  }

  console.log('')
  console.log(`🎉 种子完成：新增 ${inserted} 条，跳过 ${skipped} 条`)
  console.log('   访问 /work 查看公开页，/admin/projects 后台管理')
}

seed().catch(err => {
  console.error('❌ 种子失败:', err)
  process.exit(1)
})
