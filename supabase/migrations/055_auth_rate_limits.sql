-- Per-account and per-client abuse throttling shared by all Vercel instances.
-- Does not store raw email, user name, or IP address.
CREATE TABLE IF NOT EXISTS auth_rate_limits (
  scope TEXT NOT NULL CHECK (length(scope) BETWEEN 2 AND 48),
  subject_hash CHAR(64) NOT NULL,
  window_started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  hit_count INTEGER NOT NULL DEFAULT 0 CHECK (hit_count >= 0),
  PRIMARY KEY (scope, subject_hash)
);
CREATE INDEX IF NOT EXISTS auth_rate_limits_window_start_idx ON auth_rate_limits(window_started_at);
-- Periodic cleanup (future maintenance):
-- DELETE FROM auth_rate_limits WHERE window_started_at < NOW() - INTERVAL '7 days';
