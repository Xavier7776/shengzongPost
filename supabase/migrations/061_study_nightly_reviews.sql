CREATE TABLE IF NOT EXISTS study_nightly_reviews (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  study_date DATE NOT NULL,
  record_count INTEGER NOT NULL CHECK (record_count >= 0),
  minutes INTEGER NOT NULL CHECK (minutes >= 0),
  analysis JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, study_date),
  CHECK ((record_count = 0 AND analysis IS NULL) OR (record_count > 0 AND analysis IS NOT NULL AND jsonb_typeof(analysis) = 'object'))
);
