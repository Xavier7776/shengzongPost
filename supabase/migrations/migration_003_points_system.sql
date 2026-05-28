-- 在 Neon 控制台执行一次即可
-- 积分系统

-- 用户积分余额
ALTER TABLE users ADD COLUMN IF NOT EXISTS points INTEGER NOT NULL DEFAULT 0;

-- 积分流水记录
CREATE TABLE IF NOT EXISTS point_transactions (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount     INTEGER NOT NULL,
  reason     VARCHAR(50) NOT NULL,
  ref_slug   TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_point_tx_user ON point_transactions(user_id, created_at DESC);

-- 防重复表：记录用户对某篇文章是否已获得过阅读积分
CREATE TABLE IF NOT EXISTS point_read_log (
  user_id    INTEGER NOT NULL,
  post_slug  TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, post_slug)
);
