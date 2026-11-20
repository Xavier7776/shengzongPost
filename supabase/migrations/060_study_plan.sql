CREATE TABLE IF NOT EXISTS study_plans (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  snapshot JSONB NOT NULL CHECK (jsonb_typeof(snapshot) = 'object'),
  revision INTEGER NOT NULL DEFAULT 1 CHECK (revision > 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
