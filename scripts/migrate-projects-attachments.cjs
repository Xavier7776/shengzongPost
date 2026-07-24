// 一次性迁移脚本：为 projects 表添加 attachments 字段
// 用法：node scripts/migrate-projects-attachments.cjs
require('dotenv').config({ path: '.env.local' })
const { neon } = require('@neondatabase/serverless')

if (!process.env.DATABASE_URL) {
  console.error('错误：未配置 DATABASE_URL')
  process.exit(1)
}

const sql = neon(process.env.DATABASE_URL, { fetchOptions: { cache: 'no-store' } })

async function main() {
  console.log('开始执行迁移：projects 表添加 attachments 字段')
  await sql`
    ALTER TABLE projects
    ADD COLUMN IF NOT EXISTS attachments JSONB NOT NULL DEFAULT '[]'::jsonb
  `
  console.log('✓ projects.attachments 字段已添加')

  const rows = await sql`
    SELECT column_name, data_type, is_nullable, column_default
    FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'attachments'
  `
  console.log('字段校验：', rows[0])

  // 顺带确保 posts 表也有（旧库可能未执行）
  await sql`
    ALTER TABLE posts
    ADD COLUMN IF NOT EXISTS attachments JSONB NOT NULL DEFAULT '[]'::jsonb
  `
  console.log('✓ posts.attachments 字段已确认存在')
  process.exit(0)
}

main().catch(err => {
  console.error('迁移失败：', err)
  process.exit(1)
})
