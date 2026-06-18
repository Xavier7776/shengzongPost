-- 046_github_trending.sql
-- GitHub Trending 表：存储每日/每周热门项目和 Star 增速排行

CREATE TABLE IF NOT EXISTS "public"."github_trending" (
  id            SERIAL PRIMARY KEY,
  repo_name     VARCHAR(255) NOT NULL,
  slug          VARCHAR(255) NOT NULL,
  full_name     VARCHAR(255) NOT NULL,
  description   TEXT,
  html_url      VARCHAR(500) NOT NULL,
  stars         INTEGER DEFAULT 0,
  forks         INTEGER DEFAULT 0,
  language      VARCHAR(100),
  owner_avatar  VARCHAR(500),
  topics        TEXT[] DEFAULT '{}',
  period        VARCHAR(20) NOT NULL,           -- 'daily' | 'weekly' | 'growth'
  stars_gained  INTEGER DEFAULT 0,              -- 与上次爬取的差值
  rank          INTEGER DEFAULT 0,              -- 排名 (1-30)
  crawled_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  crawled_date  DATE DEFAULT CURRENT_DATE,      -- 用于去重的日期列
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_trending_period_crawled ON github_trending(period, crawled_at DESC);
CREATE INDEX IF NOT EXISTS idx_trending_stars ON github_trending(stars DESC);
CREATE INDEX IF NOT EXISTS idx_trending_slug ON github_trending(slug);
CREATE INDEX IF NOT EXISTS idx_trending_stars_gained ON github_trending(stars_gained DESC);

-- 唯一约束: 同一 period + 同一 repo + 同一天只保留一条
CREATE UNIQUE INDEX IF NOT EXISTS idx_trending_unique_daily
  ON github_trending(repo_name, period, crawled_date);
