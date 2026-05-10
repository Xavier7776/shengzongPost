


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';


SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."calendar_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "title" "text" NOT NULL,
    "event_date" "date" NOT NULL,
    "event_type" "text" DEFAULT 'custom'::"text",
    "color" "text",
    "note" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."calendar_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."counter_requests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "couple_id" "uuid" NOT NULL,
    "label" "text" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "created_by" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."counter_requests" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."couple_info" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user1_id" "uuid" NOT NULL,
    "user2_id" "uuid" NOT NULL,
    "anniversary_date" "date" NOT NULL,
    "next_meetup_date" "date",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "proposed_meetup_date" "date",
    "proposed_by" "uuid",
    "meetup_approved" boolean DEFAULT true
);


ALTER TABLE "public"."couple_info" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."daily_counters" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "couple_id" "uuid" NOT NULL,
    "label" "text" NOT NULL,
    "count" integer DEFAULT 0 NOT NULL,
    "counter_date" "date" DEFAULT CURRENT_DATE NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."daily_counters" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."daily_questions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "question_text" "text" NOT NULL,
    "date" "date" NOT NULL
);


ALTER TABLE "public"."daily_questions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."diaries" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "content" "text" NOT NULL,
    "voice_url" "text",
    "visibility" "text" DEFAULT 'shared'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "diaries_visibility_check" CHECK (("visibility" = ANY (ARRAY['private'::"text", 'shared'::"text", 'partner'::"text"])))
);


ALTER TABLE "public"."diaries" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."drawing_games" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "couple_id" "uuid" NOT NULL,
    "drawer" "text" NOT NULL,
    "guesser" "text" NOT NULL,
    "word" "text" NOT NULL,
    "strokes" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "guess_text" "text",
    "status" "text" DEFAULT 'drawing'::"text" NOT NULL,
    "round" integer DEFAULT 1 NOT NULL,
    "drawer_score" integer DEFAULT 0 NOT NULL,
    "guesser_score" integer DEFAULT 0 NOT NULL,
    "hint_revealed" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "next_round_votes" "jsonb" DEFAULT '[]'::"jsonb"
);


ALTER TABLE "public"."drawing_games" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."expenses" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "couple_id" "uuid" NOT NULL,
    "user_id" "text" NOT NULL,
    "amount" numeric(10,2) NOT NULL,
    "category" "text" NOT NULL,
    "note" "text",
    "expense_date" "date" DEFAULT CURRENT_DATE NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "expenses_amount_check" CHECK (("amount" > (0)::numeric)),
    CONSTRAINT "expenses_category_check" CHECK (("category" = ANY (ARRAY['交通'::"text", '餐饮'::"text", '礼物'::"text", '住宿'::"text", '娱乐'::"text", '其他'::"text"])))
);


ALTER TABLE "public"."expenses" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."gomoku_games" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "couple_id" "uuid" NOT NULL,
    "black_player" "uuid" NOT NULL,
    "white_player" "uuid" NOT NULL,
    "board" "jsonb" NOT NULL,
    "current_turn" integer DEFAULT 1 NOT NULL,
    "winner" integer,
    "win_line" "jsonb",
    "move_count" integer DEFAULT 0 NOT NULL,
    "status" "text" DEFAULT 'playing'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "moves_history" "jsonb" DEFAULT '[]'::"jsonb",
    "undo_requested_by" "text",
    "resign_requested_by" "text"
);


ALTER TABLE "public"."gomoku_games" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."gomoku_stats" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "couple_id" "uuid" NOT NULL,
    "user_id" "text" NOT NULL,
    "wins" integer DEFAULT 0 NOT NULL,
    "losses" integer DEFAULT 0 NOT NULL,
    "draws" integer DEFAULT 0 NOT NULL
);


ALTER TABLE "public"."gomoku_stats" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."goodnights" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "checkin_date" "date" DEFAULT CURRENT_DATE NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."goodnights" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."letters" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "sender_id" "uuid" NOT NULL,
    "receiver_id" "uuid" NOT NULL,
    "content" "text" NOT NULL,
    "scheduled_at" timestamp with time zone NOT NULL,
    "delivered" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."letters" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."memories" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "couple_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "happened_at" "date" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "photo_urls" "jsonb" DEFAULT '[]'::"jsonb"
);


ALTER TABLE "public"."memories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."moods" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "mood_type" "text" NOT NULL,
    "mood_date" "date" DEFAULT CURRENT_DATE NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "mood_text" "text",
    "mood_image_url" "text",
    "custom_emoji_url" "text"
);


ALTER TABLE "public"."moods" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."morning_checkins" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "text" NOT NULL,
    "checkin_date" "date" DEFAULT CURRENT_DATE NOT NULL,
    "checkin_time" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."morning_checkins" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."photos" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "couple_id" "uuid" NOT NULL,
    "uploader_id" "uuid" NOT NULL,
    "storage_path" "text" NOT NULL,
    "caption" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."photos" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."pings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "sender_id" "uuid" NOT NULL,
    "receiver_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."pings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "nickname" "text" NOT NULL,
    "avatar_url" "text",
    "city" "text" DEFAULT ''::"text",
    "latitude" double precision DEFAULT 0,
    "longitude" double precision DEFAULT 0,
    "partner_id" "uuid",
    "push_token" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."question_answers" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "question_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "answer" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."question_answers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."travel_pins" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "couple_id" "uuid" NOT NULL,
    "user_id" "text" NOT NULL,
    "province_code" "text" NOT NULL,
    "province_name" "text" NOT NULL,
    "note" "text",
    "photo_url" "text",
    "visit_date" "date",
    "pin_type" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "travel_pins_pin_type_check" CHECK (("pin_type" = ANY (ARRAY['visited'::"text", 'wishlist'::"text"])))
);


ALTER TABLE "public"."travel_pins" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."wishlist" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "couple_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "completed" boolean DEFAULT false,
    "completed_photo_url" "text",
    "completed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."wishlist" OWNER TO "postgres";


ALTER TABLE ONLY "public"."calendar_events"
    ADD CONSTRAINT "calendar_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."counter_requests"
    ADD CONSTRAINT "counter_requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."couple_info"
    ADD CONSTRAINT "couple_info_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."couple_info"
    ADD CONSTRAINT "couple_info_user1_user2_key" UNIQUE ("user1_id", "user2_id");



ALTER TABLE ONLY "public"."daily_counters"
    ADD CONSTRAINT "daily_counters_couple_id_label_counter_date_key" UNIQUE ("couple_id", "label", "counter_date");



ALTER TABLE ONLY "public"."daily_counters"
    ADD CONSTRAINT "daily_counters_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."daily_questions"
    ADD CONSTRAINT "daily_questions_date_key" UNIQUE ("date");



ALTER TABLE ONLY "public"."daily_questions"
    ADD CONSTRAINT "daily_questions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."diaries"
    ADD CONSTRAINT "diaries_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."drawing_games"
    ADD CONSTRAINT "drawing_games_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."expenses"
    ADD CONSTRAINT "expenses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."gomoku_games"
    ADD CONSTRAINT "gomoku_games_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."gomoku_stats"
    ADD CONSTRAINT "gomoku_stats_couple_id_user_id_key" UNIQUE ("couple_id", "user_id");



ALTER TABLE ONLY "public"."gomoku_stats"
    ADD CONSTRAINT "gomoku_stats_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."goodnights"
    ADD CONSTRAINT "goodnights_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."goodnights"
    ADD CONSTRAINT "goodnights_user_id_checkin_date_key" UNIQUE ("user_id", "checkin_date");



ALTER TABLE ONLY "public"."letters"
    ADD CONSTRAINT "letters_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."memories"
    ADD CONSTRAINT "memories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."moods"
    ADD CONSTRAINT "moods_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."morning_checkins"
    ADD CONSTRAINT "morning_checkins_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."morning_checkins"
    ADD CONSTRAINT "morning_checkins_user_id_checkin_date_key" UNIQUE ("user_id", "checkin_date");



ALTER TABLE ONLY "public"."photos"
    ADD CONSTRAINT "photos_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pings"
    ADD CONSTRAINT "pings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."question_answers"
    ADD CONSTRAINT "question_answers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."question_answers"
    ADD CONSTRAINT "question_answers_question_id_user_id_key" UNIQUE ("question_id", "user_id");



ALTER TABLE ONLY "public"."travel_pins"
    ADD CONSTRAINT "travel_pins_couple_id_province_code_key" UNIQUE ("couple_id", "province_code");



ALTER TABLE ONLY "public"."travel_pins"
    ADD CONSTRAINT "travel_pins_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."wishlist"
    ADD CONSTRAINT "wishlist_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_expenses_couple_date" ON "public"."expenses" USING "btree" ("couple_id", "expense_date");



CREATE UNIQUE INDEX "idx_moods_user_date" ON "public"."moods" USING "btree" ("user_id", "mood_date");



CREATE INDEX "idx_morning_checkins_user_date" ON "public"."morning_checkins" USING "btree" ("user_id", "checkin_date");



CREATE INDEX "idx_profiles_push_token" ON "public"."profiles" USING "btree" ("push_token") WHERE ("push_token" IS NOT NULL);



CREATE INDEX "idx_travel_pins_couple" ON "public"."travel_pins" USING "btree" ("couple_id");



ALTER TABLE ONLY "public"."calendar_events"
    ADD CONSTRAINT "calendar_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."counter_requests"
    ADD CONSTRAINT "counter_requests_couple_id_fkey" FOREIGN KEY ("couple_id") REFERENCES "public"."couple_info"("id");



ALTER TABLE ONLY "public"."couple_info"
    ADD CONSTRAINT "couple_info_proposed_by_fkey" FOREIGN KEY ("proposed_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."couple_info"
    ADD CONSTRAINT "couple_info_user1_id_fkey" FOREIGN KEY ("user1_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."couple_info"
    ADD CONSTRAINT "couple_info_user2_id_fkey" FOREIGN KEY ("user2_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."daily_counters"
    ADD CONSTRAINT "daily_counters_couple_id_fkey" FOREIGN KEY ("couple_id") REFERENCES "public"."couple_info"("id");



ALTER TABLE ONLY "public"."diaries"
    ADD CONSTRAINT "diaries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."drawing_games"
    ADD CONSTRAINT "drawing_games_couple_id_fkey" FOREIGN KEY ("couple_id") REFERENCES "public"."couple_info"("id");



ALTER TABLE ONLY "public"."expenses"
    ADD CONSTRAINT "expenses_couple_id_fkey" FOREIGN KEY ("couple_id") REFERENCES "public"."couple_info"("id");



ALTER TABLE ONLY "public"."gomoku_games"
    ADD CONSTRAINT "gomoku_games_couple_id_fkey" FOREIGN KEY ("couple_id") REFERENCES "public"."couple_info"("id");



ALTER TABLE ONLY "public"."goodnights"
    ADD CONSTRAINT "goodnights_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."letters"
    ADD CONSTRAINT "letters_receiver_id_fkey" FOREIGN KEY ("receiver_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."letters"
    ADD CONSTRAINT "letters_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."memories"
    ADD CONSTRAINT "memories_couple_id_fkey" FOREIGN KEY ("couple_id") REFERENCES "public"."couple_info"("id");



ALTER TABLE ONLY "public"."moods"
    ADD CONSTRAINT "moods_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."photos"
    ADD CONSTRAINT "photos_couple_id_fkey" FOREIGN KEY ("couple_id") REFERENCES "public"."couple_info"("id");



ALTER TABLE ONLY "public"."photos"
    ADD CONSTRAINT "photos_uploader_id_fkey" FOREIGN KEY ("uploader_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."pings"
    ADD CONSTRAINT "pings_receiver_id_fkey" FOREIGN KEY ("receiver_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."pings"
    ADD CONSTRAINT "pings_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."question_answers"
    ADD CONSTRAINT "question_answers_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "public"."daily_questions"("id");



ALTER TABLE ONLY "public"."question_answers"
    ADD CONSTRAINT "question_answers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."travel_pins"
    ADD CONSTRAINT "travel_pins_couple_id_fkey" FOREIGN KEY ("couple_id") REFERENCES "public"."couple_info"("id");



ALTER TABLE ONLY "public"."wishlist"
    ADD CONSTRAINT "wishlist_couple_id_fkey" FOREIGN KEY ("couple_id") REFERENCES "public"."couple_info"("id");



CREATE POLICY "allow_all_counter_requests" ON "public"."counter_requests" USING (true) WITH CHECK (true);



CREATE POLICY "allow_all_daily_counters" ON "public"."daily_counters" USING (true) WITH CHECK (true);



CREATE POLICY "allow_all_drawing" ON "public"."drawing_games" USING (true) WITH CHECK (true);



CREATE POLICY "allow_all_expenses" ON "public"."expenses" USING (true) WITH CHECK (true);



CREATE POLICY "allow_all_gomoku" ON "public"."gomoku_games" USING (true) WITH CHECK (true);



CREATE POLICY "allow_all_gomoku_stats" ON "public"."gomoku_stats" USING (true) WITH CHECK (true);



CREATE POLICY "allow_all_goodnights" ON "public"."goodnights" USING (true) WITH CHECK (true);



CREATE POLICY "allow_all_morning_checkins" ON "public"."morning_checkins" USING (true) WITH CHECK (true);



CREATE POLICY "allow_all_pings" ON "public"."pings" USING (true) WITH CHECK (true);



CREATE POLICY "allow_all_travel_pins" ON "public"."travel_pins" USING (true) WITH CHECK (true);



ALTER TABLE "public"."calendar_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."counter_requests" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."daily_counters" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."drawing_games" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."expenses" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."gomoku_games" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."gomoku_stats" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."goodnights" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."morning_checkins" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."pings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."travel_pins" ENABLE ROW LEVEL SECURITY;


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON TABLE "public"."calendar_events" TO "anon";
GRANT ALL ON TABLE "public"."calendar_events" TO "authenticated";
GRANT ALL ON TABLE "public"."calendar_events" TO "service_role";



GRANT ALL ON TABLE "public"."counter_requests" TO "anon";
GRANT ALL ON TABLE "public"."counter_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."counter_requests" TO "service_role";



GRANT ALL ON TABLE "public"."couple_info" TO "anon";
GRANT ALL ON TABLE "public"."couple_info" TO "authenticated";
GRANT ALL ON TABLE "public"."couple_info" TO "service_role";



GRANT ALL ON TABLE "public"."daily_counters" TO "anon";
GRANT ALL ON TABLE "public"."daily_counters" TO "authenticated";
GRANT ALL ON TABLE "public"."daily_counters" TO "service_role";



GRANT ALL ON TABLE "public"."daily_questions" TO "anon";
GRANT ALL ON TABLE "public"."daily_questions" TO "authenticated";
GRANT ALL ON TABLE "public"."daily_questions" TO "service_role";



GRANT ALL ON TABLE "public"."diaries" TO "anon";
GRANT ALL ON TABLE "public"."diaries" TO "authenticated";
GRANT ALL ON TABLE "public"."diaries" TO "service_role";



GRANT ALL ON TABLE "public"."drawing_games" TO "anon";
GRANT ALL ON TABLE "public"."drawing_games" TO "authenticated";
GRANT ALL ON TABLE "public"."drawing_games" TO "service_role";



GRANT ALL ON TABLE "public"."expenses" TO "anon";
GRANT ALL ON TABLE "public"."expenses" TO "authenticated";
GRANT ALL ON TABLE "public"."expenses" TO "service_role";



GRANT ALL ON TABLE "public"."gomoku_games" TO "anon";
GRANT ALL ON TABLE "public"."gomoku_games" TO "authenticated";
GRANT ALL ON TABLE "public"."gomoku_games" TO "service_role";



GRANT ALL ON TABLE "public"."gomoku_stats" TO "anon";
GRANT ALL ON TABLE "public"."gomoku_stats" TO "authenticated";
GRANT ALL ON TABLE "public"."gomoku_stats" TO "service_role";



GRANT ALL ON TABLE "public"."goodnights" TO "anon";
GRANT ALL ON TABLE "public"."goodnights" TO "authenticated";
GRANT ALL ON TABLE "public"."goodnights" TO "service_role";



GRANT ALL ON TABLE "public"."letters" TO "anon";
GRANT ALL ON TABLE "public"."letters" TO "authenticated";
GRANT ALL ON TABLE "public"."letters" TO "service_role";



GRANT ALL ON TABLE "public"."memories" TO "anon";
GRANT ALL ON TABLE "public"."memories" TO "authenticated";
GRANT ALL ON TABLE "public"."memories" TO "service_role";



GRANT ALL ON TABLE "public"."moods" TO "anon";
GRANT ALL ON TABLE "public"."moods" TO "authenticated";
GRANT ALL ON TABLE "public"."moods" TO "service_role";



GRANT ALL ON TABLE "public"."morning_checkins" TO "anon";
GRANT ALL ON TABLE "public"."morning_checkins" TO "authenticated";
GRANT ALL ON TABLE "public"."morning_checkins" TO "service_role";



GRANT ALL ON TABLE "public"."photos" TO "anon";
GRANT ALL ON TABLE "public"."photos" TO "authenticated";
GRANT ALL ON TABLE "public"."photos" TO "service_role";



GRANT ALL ON TABLE "public"."pings" TO "anon";
GRANT ALL ON TABLE "public"."pings" TO "authenticated";
GRANT ALL ON TABLE "public"."pings" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."question_answers" TO "anon";
GRANT ALL ON TABLE "public"."question_answers" TO "authenticated";
GRANT ALL ON TABLE "public"."question_answers" TO "service_role";



GRANT ALL ON TABLE "public"."travel_pins" TO "anon";
GRANT ALL ON TABLE "public"."travel_pins" TO "authenticated";
GRANT ALL ON TABLE "public"."travel_pins" TO "service_role";



GRANT ALL ON TABLE "public"."wishlist" TO "anon";
GRANT ALL ON TABLE "public"."wishlist" TO "authenticated";
GRANT ALL ON TABLE "public"."wishlist" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";







