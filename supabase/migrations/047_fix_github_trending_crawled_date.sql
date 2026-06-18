-- 047_fix_github_trending_crawled_date.sql
-- 修复 github_trending 表：补 crawled_date 列 + 唯一索引
-- (046 迁移定义了该列，但实际数据库表里缺失，导致爬虫 INSERT 失败)

ALTER TABLE github_trending
  ADD COLUMN IF NOT EXISTS crawled_date DATE DEFAULT CURRENT_DATE;

-- 唯一约束: 同一 period + 同一 repo + 同一天只保留一条
-- (与 046 迁移定义一致，IF NOT EXISTS 保证幂等)
CREATE UNIQUE INDEX IF NOT EXISTS idx_trending_unique_daily
  ON github_trending(repo_name, period, crawled_date);
