-- migration_009: 给 cursor_effects 加 poster_url 字段，存静态预览图路径
--
-- 背景：商城/管理页用 SpriteCanvas 多实例播放 sprite-sheet 动画会闪烁
-- （clearRect+drawImage 非原子，合成器采样到透明中间态）。
-- 改用源站 codex-pets.net 提供的 poster.webp 静态图作为卡片预览，
-- 全局跟随 CursorFollower 仍用 sprite-sheet 动画（单实例不闪）。

ALTER TABLE cursor_effects
  ADD COLUMN IF NOT EXISTS poster_url TEXT;
