-- 创建 virtual_pets 表
CREATE TABLE IF NOT EXISTS virtual_pets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id UUID NOT NULL REFERENCES couple_info(id),
  name TEXT NOT NULL,
  level INTEGER DEFAULT 1 NOT NULL,
  exp INTEGER DEFAULT 0 NOT NULL,
  happiness INTEGER DEFAULT 80 NOT NULL,
  hunger INTEGER DEFAULT 50 NOT NULL,
  pet_type TEXT DEFAULT 'default',
  last_fed_at TIMESTAMPTZ,
  last_played_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE virtual_pets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_virtual_pets" ON virtual_pets FOR ALL USING (true) WITH CHECK (true);
GRANT ALL ON TABLE virtual_pets TO anon, authenticated, service_role;

-- 创建 pet_actions 表
CREATE TABLE IF NOT EXISTS pet_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID NOT NULL REFERENCES virtual_pets(id),
  user_id TEXT NOT NULL,
  action_type TEXT NOT NULL,
  value INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE pet_actions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_pet_actions" ON pet_actions FOR ALL USING (true) WITH CHECK (true);
GRANT ALL ON TABLE pet_actions TO anon, authenticated, service_role;

-- 开启 Realtime（所有需要实时同步的表，已开启的会自动跳过）
DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'counter_requests', 'daily_counters', 'drawing_games', 'expenses',
    'gomoku_games', 'goodnights', 'moods', 'morning_checkins',
    'pings', 'question_answers', 'travel_pins', 'virtual_pets'
  ] LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND tablename = t
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE %I', t);
    END IF;
  END LOOP;
END $$;
