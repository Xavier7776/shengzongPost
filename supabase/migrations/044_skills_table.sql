-- 044_skills_table.sql
-- Skills 表：存储从 GitHub 等平台爬取的 AI Agent Skills

CREATE TABLE IF NOT EXISTS "public"."skills" (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  content TEXT,
  source_url VARCHAR(500) UNIQUE NOT NULL,
  source_type VARCHAR(20) NOT NULL DEFAULT 'github',
  stars INTEGER DEFAULT 0,
  tags TEXT[] DEFAULT '{}',
  category VARCHAR(50) DEFAULT 'other',
  cover_image VARCHAR(500),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_skills_category ON "public"."skills"(category);
CREATE INDEX IF NOT EXISTS idx_skills_stars ON "public"."skills"(stars DESC);
CREATE INDEX IF NOT EXISTS idx_skills_updated ON "public"."skills"(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_skills_source_type ON "public"."skills"(source_type);
