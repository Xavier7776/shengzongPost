-- 049_add_projects_content.sql
-- 为 projects 表增加 content 字段：存储项目详细介绍（Markdown 格式）
-- 详情页 /work/[slug] 使用 marked 渲染

ALTER TABLE "public"."projects" ADD COLUMN IF NOT EXISTS content TEXT;
