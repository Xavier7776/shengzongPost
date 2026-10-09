-- Candidate only: production execution requires separate explicit approval.
-- Observations are independent of article existence; no historical backfill.
CREATE TABLE IF NOT EXISTS learn_publish_runs (
  attempt_id UUID PRIMARY KEY,
  edition_date DATE NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('chatgpt_task','signed_api','manual')),
  task_id TEXT CHECK (task_id IS NULL OR task_id ~ '^[a-zA-Z0-9_-]{1,128}$'),
  scheduled_for TIMESTAMPTZ,
  status TEXT NOT NULL CHECK (status IN ('started','validated','db_written','db_verified','public_verified','conflict','failed','unknown')),
  post_slug TEXT CHECK (post_slug IS NULL OR post_slug = 'daily-learn-' || edition_date::text),
  content_sha256 CHAR(64) CHECK (content_sha256 IS NULL OR content_sha256 ~ '^[a-f0-9]{64}$'),
  schema_version INTEGER CHECK (schema_version IS NULL OR schema_version > 0),
  source_count INTEGER CHECK (source_count IS NULL OR source_count BETWEEN 2 AND 5),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at TIMESTAMPTZ,
  error_category TEXT CHECK (error_category IS NULL OR error_category IN ('validation','source_unverified','database_failed','readback_failed','public_pending','conflict','channel_unavailable','unknown')),
  CHECK (finished_at IS NULL OR finished_at >= started_at),
  CHECK (status NOT IN ('validated','db_written','db_verified','public_verified') OR
    (post_slug IS NOT NULL AND content_sha256 IS NOT NULL AND schema_version IS NOT NULL AND source_count IS NOT NULL)),
  CHECK (status <> 'public_verified' OR finished_at IS NOT NULL),
  CHECK (source <> 'chatgpt_task' OR task_id IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS learn_publish_runs_date_started ON learn_publish_runs(edition_date DESC, started_at DESC);
-- Retain audit records on rollback; do not DROP or infer runs from existing posts.
