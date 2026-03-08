
ALTER TABLE public.game_state
  ADD COLUMN IF NOT EXISTS streak_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_daily_claim date,
  ADD COLUMN IF NOT EXISTS last_weekly_claim date;
