-- Avatar Frame Shop System

-- 头像框目录
CREATE TABLE IF NOT EXISTS avatar_frames (
  id          SERIAL PRIMARY KEY,
  key         VARCHAR(50)  NOT NULL UNIQUE,
  name        VARCHAR(100) NOT NULL,
  description TEXT,
  price       INTEGER      NOT NULL DEFAULT 0,
  rarity      VARCHAR(20)  NOT NULL DEFAULT 'common',
  css_key     VARCHAR(50)  NOT NULL,
  enabled     BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- 用户已购买的头像框
CREATE TABLE IF NOT EXISTS user_frames (
  id           SERIAL PRIMARY KEY,
  user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  frame_id     INTEGER NOT NULL REFERENCES avatar_frames(id) ON DELETE CASCADE,
  purchased_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, frame_id)
);
CREATE INDEX IF NOT EXISTS idx_user_frames_user ON user_frames(user_id);

-- 当前装备的头像框
ALTER TABLE users ADD COLUMN IF NOT EXISTS equipped_frame INTEGER REFERENCES avatar_frames(id) ON DELETE SET NULL;

-- 插入初始头像框数据
INSERT INTO avatar_frames (key, name, description, price, rarity, css_key) VALUES
  ('golden_ring', '金色光环', '温暖的金色光环，优雅地环绕你的身份', 100, 'common', 'golden_ring'),
  ('neon_blue',   '霓虹电路', '电蓝色能量在你的数字形象周围涌动', 200, 'common', 'neon_blue'),
  ('frost',       '霜晶之壳', '晶莹的霜花凝结成半透明的外壳', 300, 'rare', 'frost'),
  ('rose_gold',   '玫瑰之瓣', '精致的玫瑰金暖意，如阳光下的花瓣', 250, 'rare', 'rose_gold'),
  ('aurora',      '极光幻影', '极光在你的头像周围舞动，变幻万千', 400, 'epic', 'aurora'),
  ('flame',       '龙息烈焰', '炽烈的火焰环绕你的头像，彰显不羁力量', 500, 'epic', 'flame'),
  ('diamond',     '天钻星芒', '最稀有的头像框，你的形象闪耀天钻般的光芒', 1000, 'legendary', 'diamond')
ON CONFLICT (key) DO NOTHING;
