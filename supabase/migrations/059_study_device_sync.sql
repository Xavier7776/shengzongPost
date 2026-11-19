ALTER TABLE study_records ADD COLUMN IF NOT EXISTS sync_removed BOOLEAN NOT NULL DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS study_sync_devices (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  pairing_hash TEXT UNIQUE,
  pairing_expires_at TIMESTAMPTZ,
  device_token_hash TEXT UNIQUE,
  device_name TEXT,
  linked_at TIMESTAMPTZ,
  last_sync_at TIMESTAMPTZ
);
