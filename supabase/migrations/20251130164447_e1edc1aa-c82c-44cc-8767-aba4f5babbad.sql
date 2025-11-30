-- Create leaderboard table
CREATE TABLE public.leaderboard (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT NOT NULL,
  score INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.leaderboard ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read leaderboard
CREATE POLICY "Anyone can view leaderboard"
  ON public.leaderboard
  FOR SELECT
  USING (true);

-- Allow anyone to insert scores
CREATE POLICY "Anyone can insert scores"
  ON public.leaderboard
  FOR INSERT
  WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX idx_leaderboard_score ON public.leaderboard(score DESC);
CREATE INDEX idx_leaderboard_created_at ON public.leaderboard(created_at DESC);