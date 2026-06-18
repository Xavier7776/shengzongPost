-- Cursor Follower Effects Shop System（鼠标跟随效果商城）

-- 鼠标效果目录
CREATE TABLE IF NOT EXISTS cursor_effects (
  id            SERIAL PRIMARY KEY,
  key           VARCHAR(50)  NOT NULL UNIQUE,
  name          VARCHAR(100) NOT NULL,
  description   TEXT,
  price         INTEGER      NOT NULL DEFAULT 0,
  rarity        VARCHAR(20)  NOT NULL DEFAULT 'common',
  -- sprite-sheet 渲染参数（codex-pets 契约：8 列 × 9 行多状态）
  sprite_url    TEXT,                                   -- /cursor-effects/<key>.webp；NULL→emoji 兜底
  cols          INTEGER      NOT NULL DEFAULT 8,
  rows          INTEGER      NOT NULL DEFAULT 9,
  fps           INTEGER      NOT NULL DEFAULT 10,
  frame_width   INTEGER      NOT NULL DEFAULT 192,
  frame_height  INTEGER      NOT NULL DEFAULT 208,
  scale         INTEGER      NOT NULL DEFAULT 56,        -- 渲染高度 px（宽度按帧宽高比推算）
  follow_easing REAL         NOT NULL DEFAULT 0.12,      -- lerp 系数，越小越慢
  state_map     TEXT         NOT NULL DEFAULT '{"idle":0,"runRight":1,"runLeft":2}',  -- 运动→行号 JSON
  -- emoji 兜底（sprite_url 为 NULL 时使用）
  emoji         VARCHAR(10)  NOT NULL DEFAULT '👻',
  enabled       BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- 用户已购买的鼠标效果
CREATE TABLE IF NOT EXISTS user_cursor_effects (
  id           SERIAL PRIMARY KEY,
  user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  effect_id    INTEGER NOT NULL REFERENCES cursor_effects(id) ON DELETE CASCADE,
  purchased_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, effect_id)
);
CREATE INDEX IF NOT EXISTS idx_user_cursor_effects_user ON user_cursor_effects(user_id);

-- 当前装备的鼠标效果
ALTER TABLE users ADD COLUMN IF NOT EXISTS equipped_cursor_effect INTEGER
  REFERENCES cursor_effects(id) ON DELETE SET NULL;

-- 插入初始鼠标效果数据（6 款真实 codex-pets 精灵图，覆盖 4 个稀有度）
INSERT INTO cursor_effects (key, name, description, price, rarity, sprite_url, emoji, scale, follow_easing) VALUES
  ('astra',               '星轨伙伴 Astra', '来自星海的赛博操作员，优雅从容，陪你巡视每一处光标', 1000, 'legendary', '/cursor-effects/astra.webp',               '🌟', 56, 0.14),
  ('weary-office-worker', '厭世上班族',     '厭世但可靠的上班族宠物，陪你呈现今日工作状态',       500, 'epic',      '/cursor-effects/weary-office-worker.webp', '😟', 56, 0.10),
  ('cthulhu',             '克苏鲁小宠物',   '绿色小克苏鲁，红眼触须胡须，小小蝙蝠翼与金爪',       400, 'epic',      '/cursor-effects/cthulhu.webp',             '🐙', 56, 0.12),
  ('grey-white-cat',      '灰白小猫',       '圆脸琥珀眼的灰白双色小猫，下巴有颗独特的灰色小点',   300, 'rare',      '/cursor-effects/grey-white-cat.webp',      '🐱', 56, 0.13),
  ('rubber-duck',         '橡皮小鸭',       '光泽 3D 橡皮鸭玩具，欢快的橙色喙与小黑眼',           200, 'common',    '/cursor-effects/rubber-duck.webp',         '🦆', 56, 0.15),
  ('moochi',              '奶牛猫 Moochi',  '紧凑的黑白奶牛纹小猫，甜美的脸与清晰全身轮廓',       100, 'common',    '/cursor-effects/moochi.webp',              '🐱', 56, 0.13)
ON CONFLICT (key) DO NOTHING;
