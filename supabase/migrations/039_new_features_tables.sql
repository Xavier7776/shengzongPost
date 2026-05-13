-- ============ FEATURE 1 & 2: Quiz / Compatibility Challenge ============

CREATE TABLE IF NOT EXISTS "public"."quiz_questions" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "question_text" TEXT NOT NULL,
  "question_type" TEXT NOT NULL DEFAULT 'open',
  "options" JSONB,
  "category" TEXT DEFAULT 'general',
  "created_at" TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "public"."quiz_sessions" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "couple_id" UUID NOT NULL REFERENCES couple_info(id),
  "question_id" UUID NOT NULL REFERENCES quiz_questions(id),
  "mode" TEXT NOT NULL DEFAULT 'quiz',
  "user1_answer" TEXT,
  "user2_answer" TEXT,
  "user1_answered_at" TIMESTAMPTZ,
  "user2_answered_at" TIMESTAMPTZ,
  "is_match" BOOLEAN,
  "score_awarded" INTEGER DEFAULT 0,
  "time_limit_seconds" INTEGER DEFAULT 60,
  "status" TEXT DEFAULT 'waiting',
  "created_at" TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "public"."quiz_scores" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "couple_id" UUID NOT NULL REFERENCES couple_info(id),
  "user_id" UUID NOT NULL REFERENCES profiles(id),
  "total_score" INTEGER DEFAULT 0,
  "total_matches" INTEGER DEFAULT 0,
  "total_played" INTEGER DEFAULT 0,
  "updated_at" TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (couple_id, user_id)
);

-- ============ FEATURE 3: Custom Countdowns ============

CREATE TABLE IF NOT EXISTS "public"."countdowns" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "couple_id" UUID NOT NULL REFERENCES couple_info(id),
  "title" TEXT NOT NULL,
  "target_date" DATE NOT NULL,
  "emoji" TEXT DEFAULT '📅',
  "created_by" UUID REFERENCES profiles(id),
  "created_at" TIMESTAMPTZ DEFAULT NOW()
);

-- ============ FEATURE 4: Bucket List ============

CREATE TABLE IF NOT EXISTS "public"."bucket_list_items" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "couple_id" UUID NOT NULL REFERENCES couple_info(id),
  "title" TEXT NOT NULL,
  "description" TEXT,
  "category" TEXT NOT NULL DEFAULT '其他',
  "progress" INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  "cover_photo_url" TEXT,
  "created_by" UUID REFERENCES profiles(id),
  "completed_at" TIMESTAMPTZ,
  "created_at" TIMESTAMPTZ DEFAULT NOW()
);

-- ============ FEATURE 5: Medals / Achievements ============

CREATE TABLE IF NOT EXISTS "public"."medals" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "medal_key" TEXT NOT NULL UNIQUE,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "emoji" TEXT NOT NULL,
  "category" TEXT DEFAULT 'milestone',
  "threshold" INTEGER,
  "created_at" TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "public"."user_medals" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL REFERENCES profiles(id),
  "couple_id" UUID NOT NULL REFERENCES couple_info(id),
  "medal_id" UUID NOT NULL REFERENCES medals(id),
  "unlocked_at" TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, medal_id)
);

-- ============ FEATURE 6: Weather Care Messages ============

CREATE TABLE IF NOT EXISTS "public"."care_messages" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "sender_id" UUID NOT NULL REFERENCES profiles(id),
  "receiver_id" UUID NOT NULL REFERENCES profiles(id),
  "message_type" TEXT NOT NULL,
  "message_text" TEXT NOT NULL,
  "read" BOOLEAN DEFAULT false,
  "created_at" TIMESTAMPTZ DEFAULT NOW()
);

-- ============ FEATURE 7: Push Subscriptions ============

CREATE TABLE IF NOT EXISTS "public"."push_subscriptions" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL REFERENCES profiles(id),
  "endpoint" TEXT NOT NULL,
  "p256dh" TEXT NOT NULL,
  "auth" TEXT NOT NULL,
  "user_agent" TEXT,
  "created_at" TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, endpoint)
);

-- ============ RLS Policies (idempotent) ============

DO $$
DECLARE
  t TEXT;
  pol TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'quiz_questions', 'quiz_sessions', 'quiz_scores', 'countdowns',
    'bucket_list_items', 'medals', 'user_medals', 'care_messages', 'push_subscriptions'
  ] LOOP
    EXECUTE format('ALTER TABLE "public"."%I" ENABLE ROW LEVEL SECURITY', t);
    pol := 'allow_all_' || t;
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE policyname = pol AND tablename = t
    ) THEN
      EXECUTE format(
        'CREATE POLICY %I ON "public"."%I" FOR ALL USING (true) WITH CHECK (true)',
        pol, t
      );
    END IF;
  END LOOP;
END $$;

-- ============ Grants ============

GRANT ALL ON TABLE "public"."quiz_questions" TO anon, authenticated, service_role;
GRANT ALL ON TABLE "public"."quiz_sessions" TO anon, authenticated, service_role;
GRANT ALL ON TABLE "public"."quiz_scores" TO anon, authenticated, service_role;
GRANT ALL ON TABLE "public"."countdowns" TO anon, authenticated, service_role;
GRANT ALL ON TABLE "public"."bucket_list_items" TO anon, authenticated, service_role;
GRANT ALL ON TABLE "public"."medals" TO anon, authenticated, service_role;
GRANT ALL ON TABLE "public"."user_medals" TO anon, authenticated, service_role;
GRANT ALL ON TABLE "public"."care_messages" TO anon, authenticated, service_role;
GRANT ALL ON TABLE "public"."push_subscriptions" TO anon, authenticated, service_role;

-- ============ Enable Realtime ============

DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'quiz_sessions', 'quiz_scores', 'care_messages', 'countdowns',
    'bucket_list_items', 'user_medals', 'push_subscriptions'
  ] LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND tablename = t
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE %I', t);
    END IF;
  END LOOP;
END $$;

-- ============ Seed: Quiz Questions (skip if already exist) ============

INSERT INTO "public"."quiz_questions" ("question_text", "question_type", "options")
SELECT v.* FROM (VALUES
  ('Ta最喜欢的食物是什么？', 'open', NULL::jsonb),
  ('Ta最近的压力来源是什么？', 'open', NULL::jsonb),
  ('Ta的梦想旅行目的地是哪里？', 'open', NULL::jsonb),
  ('Ta最喜欢的电影是哪部？', 'open', NULL::jsonb),
  ('Ta收到过最开心的礼物是什么？', 'open', NULL::jsonb),
  ('Ta最喜欢哪个季节？', 'choice', '["春天","夏天","秋天","冬天"]'::jsonb),
  ('Ta是猫派还是狗派？', 'choice', '["猫派","狗派","都喜欢","都不喜欢"]'::jsonb),
  ('Ta喜欢在家约会还是出门约会？', 'choice', '["在家","出门","都可以"]'::jsonb),
  ('Ta早上喜欢喝什么？', 'choice', '["咖啡","茶","果汁","白开水"]'::jsonb),
  ('Ta喜欢看什么类型的电影？', 'choice', '["喜剧","爱情","悬疑","科幻","恐怖"]'::jsonb)
) AS v(question_text, question_type, options)
WHERE NOT EXISTS (SELECT 1 FROM quiz_questions LIMIT 1);

-- ============ Seed: Medals (skip if already exist) ============

INSERT INTO "public"."medals" ("medal_key", "title", "description", "emoji", "category", "threshold")
SELECT v.* FROM (VALUES
  ('first_morning', '初次早安', '完成第一次早安打卡', '🌅', 'achievement', NULL::int),
  ('streak_7_morning', '连续7天早安', '连续7天完成早安打卡', '🔥', 'streak', 7),
  ('first_letter', '第一封情书', '发出第一封情书', '💌', 'achievement', NULL::int),
  ('letters_10', '情书达人', '累计写了10封情书', '✉️', 'achievement', 10),
  ('wishes_5', '愿望收割机', '完成了5个心愿', '⭐', 'achievement', 5),
  ('days_100', '百天纪念', '在一起100天', '💯', 'milestone', 100),
  ('days_200', '两百天', '在一起200天', '🌟', 'milestone', 200),
  ('days_365', '一周年', '在一起365天', '🎂', 'milestone', 365),
  ('days_520', '520', '在一起520天', '💕', 'milestone', 520),
  ('days_1000', '千日之约', '在一起1000天', '💎', 'milestone', 1000),
  ('quiz_first', '初次问答', '完成第一次双人问答', '❓', 'achievement', NULL::int),
  ('quiz_perfect', '心有灵犀', '连续5题答案一致', '🧠', 'streak', 5),
  ('bucket_first', '第一个愿望', '添加了第一个心愿', '📝', 'achievement', NULL::int),
  ('bucket_complete_5', '梦想实现家', '完成5个心愿', '🏆', 'achievement', 5)
) AS v(medal_key, title, description, emoji, category, threshold)
WHERE NOT EXISTS (SELECT 1 FROM medals LIMIT 1);
