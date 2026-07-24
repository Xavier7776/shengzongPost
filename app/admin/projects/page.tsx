// app/admin/projects/page.tsx
// 个人项目管理后台：列表 + 新建 + 行内编辑 + 删除 + 启用切换
import { requireAdmin } from '@/lib/auth'
import ProjectsAdminClient from './ProjectsAdminClient'

export default async function AdminProjectsPage() {
  await requireAdmin()
  return <ProjectsAdminClient />
}
