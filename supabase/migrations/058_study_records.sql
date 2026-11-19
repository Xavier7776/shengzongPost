CREATE TABLE IF NOT EXISTS study_records (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  id TEXT NOT NULL CHECK (id ~ '^(web|android):[a-zA-Z0-9_-]{1,180}$'),
  study_date DATE NOT NULL,
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 160),
  track TEXT NOT NULL CHECK (track IN ('algorithm', 'backend', 'ai', 'project', 'hardware', 'other')),
  minutes INTEGER NOT NULL CHECK (minutes BETWEEN 1 AND 600),
  outcome TEXT NOT NULL CHECK (outcome IN ('independent', 'hinted', 'again')),
  note TEXT NOT NULL CHECK (char_length(note) <= 4000),
  review BOOLEAN NOT NULL,
  recorded_at BIGINT NOT NULL CHECK (recorded_at BETWEEN 0 AND 253402300799999),
  revision INTEGER NOT NULL DEFAULT 1 CHECK (revision > 0),
  PRIMARY KEY (user_id, id)
);

CREATE INDEX IF NOT EXISTS study_records_by_date
  ON study_records (user_id, study_date DESC, recorded_at DESC, id DESC);
