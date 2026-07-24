-- 048_projects_table.sql
-- projects 表：个人项目作品集
-- 供 /work 页面展示与 /admin/projects 后台编辑

CREATE TABLE IF NOT EXISTS "public"."projects" (
  id SERIAL PRIMARY KEY,
  slug VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  tagline VARCHAR(255),
  description TEXT,
  cover_image VARCHAR(500),
  cover_public_id VARCHAR(255),
  tech_stack TEXT[] DEFAULT '{}',
  highlights TEXT[] DEFAULT '{}',
  demo_url VARCHAR(500),
  github_url VARCHAR(500),
  year VARCHAR(20),
  sort_order INTEGER DEFAULT 0,
  enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_projects_enabled ON "public"."projects"(enabled);
CREATE INDEX IF NOT EXISTS idx_projects_sort_order ON "public"."projects"(sort_order ASC);
