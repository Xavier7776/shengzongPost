// lib/db/projects.ts
// Extracted from lib/db.ts by domain boundary. Logic unchanged.

import { sql, serializeRow, serializeRows } from './_core'

// ─── Projects (个人项目作品集) ────────────────────────────────────────────────

export interface ProjectAttachment {
  url: string
  filename: string
  size: number
}

export interface Project {
  id: number
  slug: string
  name: string
  tagline: string | null
  description: string | null
  content: string | null
  cover_image: string | null
  cover_public_id: string | null
  tech_stack: string[]
  highlights: string[]
  demo_url: string | null
  github_url: string | null
  year: string | null
  sort_order: number
  enabled: boolean
  /** md 文件附件 + 外链列表（JSONB 数组，结构：[{ url, filename, size }]） */
  attachments?: ProjectAttachment[]
  created_at: string
  updated_at: string
}

/** 公开接口：只返回 enabled 的项目，按 sort_order 排序 */
export async function getEnabledProjects(): Promise<Project[]> {
  const rows = await sql`
    SELECT * FROM projects WHERE enabled = true
    ORDER BY sort_order ASC, created_at DESC
  `
  return serializeRows(rows as Record<string, unknown>[]) as unknown as Project[]
}

/** 管理端：返回全部项目（含 disabled） */
export async function getAllProjectsAdmin(): Promise<Project[]> {
  const rows = await sql`
    SELECT * FROM projects
    ORDER BY sort_order ASC, created_at DESC
  `
  return serializeRows(rows as Record<string, unknown>[]) as unknown as Project[]
}

export interface ProjectInput {
  slug: string
  name: string
  tagline?: string | null
  description?: string | null
  content?: string | null
  cover_image?: string | null
  cover_public_id?: string | null
  tech_stack?: string[]
  highlights?: string[]
  demo_url?: string | null
  github_url?: string | null
  year?: string | null
  sort_order?: number
  enabled?: boolean
  attachments?: ProjectAttachment[]
}

export async function createProject(data: ProjectInput): Promise<Project> {
  const rows = await sql`
    INSERT INTO projects(
      slug, name, tagline, description, content, cover_image, cover_public_id,
      tech_stack, highlights, demo_url, github_url, year, sort_order, enabled, attachments
    ) VALUES(
      ${data.slug}, ${data.name}, ${data.tagline ?? null}, ${data.description ?? null},
      ${data.content ?? null}, ${data.cover_image ?? null}, ${data.cover_public_id ?? null},
      ${data.tech_stack ?? []}, ${data.highlights ?? []},
      ${data.demo_url ?? null}, ${data.github_url ?? null},
      ${data.year ?? null}, ${data.sort_order ?? 0}, ${data.enabled ?? true},
      ${JSON.stringify(data.attachments ?? [])}::jsonb
    )
    RETURNING *
  `
  return serializeRow(rows[0] as Record<string, unknown>) as unknown as Project
}

export async function updateProject(
  id: number,
  data: Partial<ProjectInput>
): Promise<Project> {
  const rows = await sql`
    UPDATE projects SET
      slug           = COALESCE(${data.slug           ?? null}, slug),
      name           = COALESCE(${data.name           ?? null}, name),
      tagline        = COALESCE(${data.tagline        ?? null}, tagline),
      description    = COALESCE(${data.description    ?? null}, description),
      content        = COALESCE(${data.content        ?? null}, content),
      cover_image    = COALESCE(${data.cover_image    ?? null}, cover_image),
      cover_public_id= COALESCE(${data.cover_public_id?? null}, cover_public_id),
      tech_stack     = COALESCE(${data.tech_stack    ?? null}, tech_stack),
      highlights     = COALESCE(${data.highlights     ?? null}, highlights),
      demo_url       = COALESCE(${data.demo_url       ?? null}, demo_url),
      github_url     = COALESCE(${data.github_url     ?? null}, github_url),
      year           = COALESCE(${data.year           ?? null}, year),
      sort_order     = COALESCE(${data.sort_order     ?? null}, sort_order),
      enabled        = COALESCE(${data.enabled        ?? null}, enabled),
      attachments    = COALESCE(${data.attachments ? JSON.stringify(data.attachments) : null}::jsonb, attachments),
      updated_at     = NOW()
    WHERE id = ${id}
    RETURNING *
  `
  return serializeRow(rows[0] as Record<string, unknown>) as unknown as Project
}

/** 删除项目，返回 cover_public_id 供 API 层清理 Cloudinary */
export async function deleteProject(id: number): Promise<string | null> {
  const rows = await sql`DELETE FROM projects WHERE id = ${id} RETURNING cover_public_id`
  return rows[0] ? ((rows[0] as { cover_public_id: string | null }).cover_public_id) : null
}
