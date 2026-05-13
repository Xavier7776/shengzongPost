-- Create calendar_events table with correct schema matching code expectations
-- Idempotent: safe to run multiple times

CREATE TABLE IF NOT EXISTS "public"."calendar_events" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL,
    "couple_id" uuid REFERENCES couple_info(id),
    "created_by" uuid,
    "title" text NOT NULL,
    "date" date NOT NULL,
    "end_date" date NOT NULL,
    "color" text,
    "note" text,
    "created_at" timestamp with time zone DEFAULT now(),
    PRIMARY KEY ("id")
);

-- RLS policy (without this, all operations are silently blocked)
ALTER TABLE "public"."calendar_events" ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'allow_all_calendar_events' AND tablename = 'calendar_events'
  ) THEN
    CREATE POLICY "allow_all_calendar_events" ON "public"."calendar_events" FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- Grants
GRANT ALL ON TABLE "public"."calendar_events" TO "anon";
GRANT ALL ON TABLE "public"."calendar_events" TO "authenticated";
GRANT ALL ON TABLE "public"."calendar_events" TO "service_role";
