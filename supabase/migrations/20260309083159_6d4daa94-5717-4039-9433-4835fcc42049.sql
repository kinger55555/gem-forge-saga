
CREATE TABLE public.game_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id text NOT NULL UNIQUE,
  play_count bigint NOT NULL DEFAULT 0,
  blocked boolean NOT NULL DEFAULT false,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.game_stats ENABLE ROW LEVEL SECURITY;

-- Anyone can read game stats (need to check blocked status)
CREATE POLICY "Anyone can read game stats"
  ON game_stats FOR SELECT
  TO authenticated
  USING (true);

-- Only admins can update (block/unblock)
CREATE POLICY "Admins can update game stats"
  ON game_stats FOR UPDATE
  TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- Only admins can insert
CREATE POLICY "Admins can insert game stats"
  ON game_stats FOR INSERT
  TO authenticated
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- Seed all games
INSERT INTO game_stats (game_id) VALUES
  ('shell'), ('clicker'), ('tworoads'), ('memory'),
  ('roulette'), ('quickdraw'), ('nova'), ('pressure'), ('spam');

-- Function to increment play count (any authenticated user can call)
CREATE OR REPLACE FUNCTION public.increment_game_play(p_game_id text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_blocked boolean;
BEGIN
  SELECT blocked INTO v_blocked FROM game_stats WHERE game_id = p_game_id;
  IF v_blocked IS TRUE THEN
    RETURN false;
  END IF;
  UPDATE game_stats SET play_count = play_count + 1, updated_at = now() WHERE game_id = p_game_id;
  RETURN true;
END;
$$;
