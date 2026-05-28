-- 修复：给 points 列加 CHECK 约束，防止积分变负
-- 在 Neon 控制台执行一次即可

ALTER TABLE users ADD CONSTRAINT check_points_non_negative CHECK (points >= 0);
