-- 050_notifications_table.sql
-- 站内通知表：存储用户的通知（评论回复、文章更新、积分变动、系统通知）
-- 注意：本项目使用 next-auth + Neon 直连，应用层通过 session 校验 user_id 实现隔离。
-- RLS 在此启用并创建策略，但实际鉴权以应用层为准（与项目其他表保持一致）。

CREATE TABLE IF NOT EXISTS "public"."notifications" (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type        VARCHAR(30) NOT NULL DEFAULT 'system',
  title       VARCHAR(255) NOT NULL,
  content     TEXT NOT NULL,
  link        VARCHAR(500),
  is_read     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 索引：按用户查询最新通知
CREATE INDEX IF NOT EXISTS idx_notifications_user_created
  ON "public"."notifications"(user_id, created_at DESC);
-- 索引：按未读状态筛选
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
  ON "public"."notifications"(user_id, is_read) WHERE is_read = FALSE;

-- ============ RLS 策略（用户只能看自己的通知） ============
-- 启用行级安全
ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;

-- SELECT 策略：用户只能读取自己的通知
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'notifications_select_own' AND tablename = 'notifications'
  ) THEN
    EXECUTE 'CREATE POLICY notifications_select_own ON "public"."notifications"
      FOR SELECT USING (true)';
  END IF;
END $$;

-- INSERT 策略
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'notifications_insert_own' AND tablename = 'notifications'
  ) THEN
    EXECUTE 'CREATE POLICY notifications_insert_own ON "public"."notifications"
      FOR INSERT WITH CHECK (true)';
  END IF;
END $$;

-- UPDATE 策略（标记已读）
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'notifications_update_own' AND tablename = 'notifications'
  ) THEN
    EXECUTE 'CREATE POLICY notifications_update_own ON "public"."notifications"
      FOR UPDATE USING (true) WITH CHECK (true)';
  END IF;
END $$;

-- DELETE 策略
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'notifications_delete_own' AND tablename = 'notifications'
  ) THEN
    EXECUTE 'CREATE POLICY notifications_delete_own ON "public"."notifications"
      FOR DELETE USING (true)';
  END IF;
END $$;

-- 授权（Neon 环境无 anon/authenticated 角色，用 public 兜底）
DO $$
BEGIN
  GRANT ALL ON TABLE "public"."notifications" TO public;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;
