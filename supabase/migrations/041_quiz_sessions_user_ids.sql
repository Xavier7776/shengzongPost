-- Add user1_id and user2_id to quiz_sessions for proper user slot assignment
ALTER TABLE public.quiz_sessions
  ADD COLUMN IF NOT EXISTS user1_id UUID REFERENCES profiles(id),
  ADD COLUMN IF NOT EXISTS user2_id UUID REFERENCES profiles(id);
