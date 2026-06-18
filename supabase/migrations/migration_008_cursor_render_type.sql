-- migration_008: 给 cursor_effects 增加 render_type 字段，支持 GIF 上传
--
-- 背景：现有鼠标效果全部使用 sprite-sheet（1536x1872 webp，8列x9行多状态），
-- 通过 SpriteCanvas 逐帧绘制。管理端要支持上传 GIF（自播放单文件），
-- GIF 无法走 SpriteCanvas 多状态行切换，需要单独渲染路径。
--
-- render_type 取值：
--   'sprite_sheet' (默认) - 现有逻辑，SpriteCanvas 渲染，支持 idle/runRight/runLeft 多状态
--   'gif'                 - 直接 <img> 渲染，GIF 自播放，无方向状态

ALTER TABLE cursor_effects
  ADD COLUMN IF NOT EXISTS render_type VARCHAR(20) NOT NULL DEFAULT 'sprite_sheet';

-- 加 CHECK 约束防止脏值
ALTER TABLE cursor_effects
  DROP CONSTRAINT IF EXISTS check_render_type;
ALTER TABLE cursor_effects
  ADD CONSTRAINT check_render_type CHECK (render_type IN ('sprite_sheet', 'gif'));
