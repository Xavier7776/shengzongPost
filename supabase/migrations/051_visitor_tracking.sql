-- 051_visitor_tracking.sql
-- 访客追踪表：存储每次页面访问记录，用于访客监控和分析
-- 注意：本项目使用 next-auth + Neon 直连，应用层通过 session 校验实现隔离。
-- 隐私合规：ip_hash 仅存哈希值，不存原始 IP；visitor_id 为 localStorage 生成的匿名 UUID。

CREATE TABLE IF NOT EXISTS "public"."visitor_tracking" (
  id           SERIAL PRIMARY KEY,
  visitor_id   VARCHAR(64)  NOT NULL,              -- 匿名访客标识（localStorage UUID，非用户 ID）
  session_id   VARCHAR(64)  NOT NULL,              -- 会话标识（30 分钟无活动算新会话）
  path         VARCHAR(500) NOT NULL,              -- 访问的页面路径
  referrer     VARCHAR(500),                       -- 来源页面（nullable）
  user_agent   VARCHAR(500),                       -- 浏览器信息（nullable）
  ip_hash     VARCHAR(64),                        -- IP 哈希（隐私保护，不存原始 IP）
  country      VARCHAR(64),                        -- 国家（可从 IP 推导，初期可为空）
  is_logged_in BOOLEAN NOT NULL DEFAULT FALSE,     -- 是否登录用户
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 索引：按时间倒序查询（仪表盘主查询）
CREATE INDEX IF NOT EXISTS idx_visitor_tracking_created_at
  ON "public"."visitor_tracking"(created_at DESC);

-- 索引：按路径聚合（热门页面查询）
CREATE INDEX IF NOT EXISTS idx_visitor_tracking_path
  ON "public"."visitor_tracking"(path);

-- 索引：按访客去重统计（独立访客数查询）
CREATE INDEX IF NOT EXISTS idx_visitor_tracking_visitor_id
  ON "public"."visitor_tracking"(visitor_id);

-- 索引：按日期聚合（每日趋势查询，created_at DESC 索引已覆盖范围查询）

-- 索引：按来源聚合（来源分析查询）
CREATE INDEX IF NOT EXISTS idx_visitor_tracking_referrer
  ON "public"."visitor_tracking"(referrer);

-- ============ RLS 策略 ============
-- 启用行级安全
ALTER TABLE "public"."visitor_tracking" ENABLE ROW LEVEL SECURITY;

-- SELECT 策略：仅允许管理员通过应用层查询（这里放行 SELECT 给所有人，实际由 API 层 requireAdminApi 鉴权）
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'visitor_tracking_select_all' AND tablename = 'visitor_tracking'
  ) THEN
    EXECUTE 'CREATE POLICY visitor_tracking_select_all ON "public"."visitor_tracking"
      FOR SELECT USING (true)';
  END IF;
END $$;

-- INSERT 策略：允许匿名上报访问数据（追踪 API 无需登录）
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'visitor_tracking_insert_all' AND tablename = 'visitor_tracking'
  ) THEN
    EXECUTE 'CREATE POLICY visitor_tracking_insert_all ON "public"."visitor_tracking"
      FOR INSERT WITH CHECK (true)';
  END IF;
END $$;

-- 授权（Neon 环境无 anon/authenticated 角色，用 public 兜底）
DO $$
BEGIN
  GRANT ALL ON TABLE "public"."visitor_tracking" TO public;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;
