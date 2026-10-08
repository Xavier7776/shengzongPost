CREATE TABLE IF NOT EXISTS learn_editions (
 post_id INTEGER PRIMARY KEY REFERENCES posts(id) ON DELETE CASCADE,
 edition_date DATE NOT NULL UNIQUE,
 topic TEXT NOT NULL CHECK (topic IN ('agent','rag','engineering','multimodal')),
 document JSONB NOT NULL,
 status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('published')),
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS learn_editions_topic_date ON learn_editions(topic,edition_date DESC);
