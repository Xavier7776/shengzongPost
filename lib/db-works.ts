// lib/db-works.ts
// 个人项目数据源
// 主源：数据库 projects 表（通过 lib/db.ts 的 getEnabledProjects 读取）
//
// 迁移文件：supabase/migrations/048_projects_table.sql, 049_add_projects_content.sql
// 后台管理：/admin/projects
// 公开页面：/work, /work/[slug]

import { getEnabledProjects, type Project as DbProject } from '@/lib/db'
import type { WorkProject } from '@/components/sections/WorkCard'

// DB Project → WorkProject 字段映射
function mapProject(p: DbProject): WorkProject {
  return {
    slug: p.slug,
    name: p.name,
    tagline: p.tagline ?? '',
    description: p.description ?? '',
    content: p.content ?? null,
    cover: p.cover_image ?? '',
    techStack: p.tech_stack ?? [],
    highlights: p.highlights ?? [],
    demoUrl: p.demo_url ?? null,
    githubUrl: p.github_url ?? null,
    year: p.year ?? '',
    attachments: p.attachments ?? [],
  }
}

export async function getAllProjects(): Promise<WorkProject[]> {
  try {
    const projects = await getEnabledProjects()
    return projects.map(mapProject)
  } catch (e) {
    console.error('[db-works] 读取 projects 表失败:', e)
    return []
  }
}

export async function getProjectBySlug(slug: string): Promise<WorkProject | null> {
  const all = await getAllProjects()
  return all.find(p => p.slug === slug) ?? null
}
