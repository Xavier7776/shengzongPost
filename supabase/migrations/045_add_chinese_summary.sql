-- 045_add_chinese_summary.sql
-- 添加中文简介字段

ALTER TABLE "public"."skills" ADD COLUMN IF NOT EXISTS chinese_summary TEXT;

-- 更新现有记录的中文简介
UPDATE "public"."skills" 
SET chinese_summary = CASE 
  WHEN description IS NOT NULL AND description != '' THEN
    '一个' || COALESCE(category, '其他') || '工具：' || description
  ELSE
    '一个专注于' || COALESCE(category, '其他') || '领域的 AI 工具。'
END
WHERE chinese_summary IS NULL;
