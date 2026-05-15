-- Migration 043: Create movie_records table for tracking movies watched together

CREATE TABLE IF NOT EXISTS public.movie_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id UUID NOT NULL REFERENCES couple_info(id) ON DELETE CASCADE,
  added_by UUID NOT NULL REFERENCES profiles(id),
  title TEXT NOT NULL,
  poster_url TEXT,
  overview TEXT,
  director TEXT,
  actors TEXT,
  genre TEXT,
  rating NUMERIC(3,1),
  release_year INTEGER,
  watched_at DATE,
  watch_note TEXT,
  tmdb_id INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.movie_records ENABLE ROW LEVEL SECURITY;

-- Permissive policy (app handles auth)
CREATE POLICY allow_all_movie_records ON public.movie_records
  FOR ALL USING (true) WITH CHECK (true);

-- Grants
GRANT ALL ON public.movie_records TO anon;
GRANT ALL ON public.movie_records TO authenticated;
GRANT ALL ON public.movie_records TO service_role;

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.movie_records;
