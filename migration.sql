-- 在数据库里执行一次即可

-- 1. posts 表加 attachments 字段
ALTER TABLE posts ADD COLUMN IF NOT EXISTS attachments JSONB NOT NULL DEFAULT '[]'::jsonb;

-- 2. 新建 post_attachments 记录表（用于管理已上传的附件文件）
CREATE TABLE IF NOT EXISTS post_attachments (
  id          SERIAL PRIMARY KEY,
  post_slug   TEXT,
  url         TEXT        NOT NULL,
  public_id   TEXT        NOT NULL,
  filename    TEXT        NOT NULL,
  size        INTEGER     NOT NULL,
  mime_type   TEXT        NOT NULL DEFAULT 'application/pdf',
  uploaded_by INTEGER     NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
