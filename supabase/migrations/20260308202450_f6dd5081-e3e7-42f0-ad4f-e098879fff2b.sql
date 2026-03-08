
-- Dice duels: matchmaking and battle state
CREATE TABLE public.dice_duels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'waiting', -- waiting, active, finished
  player1_id uuid NOT NULL,
  player2_id uuid,
  player1_dice jsonb NOT NULL DEFAULT '[]'::jsonb,
  player2_dice jsonb DEFAULT '[]'::jsonb,
  player1_hp integer NOT NULL DEFAULT 5,
  player2_hp integer NOT NULL DEFAULT 5,
  current_round integer NOT NULL DEFAULT 0,
  round_data jsonb DEFAULT '[]'::jsonb,
  winner_id uuid,
  coins_wager integer NOT NULL DEFAULT 1000,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.dice_duels ENABLE ROW LEVEL SECURITY;

-- Players can view duels they're part of or waiting duels
CREATE POLICY "Players can view own and waiting duels"
  ON public.dice_duels FOR SELECT TO authenticated
  USING (auth.uid() = player1_id OR auth.uid() = player2_id OR status = 'waiting');

-- Players can create duels
CREATE POLICY "Players can create duels"
  ON public.dice_duels FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = player1_id);

-- Players can update duels they're in
CREATE POLICY "Players can update own duels"
  ON public.dice_duels FOR UPDATE TO authenticated
  USING (auth.uid() = player1_id OR auth.uid() = player2_id);

-- Players can delete their own waiting duels
CREATE POLICY "Players can delete own waiting duels"
  ON public.dice_duels FOR DELETE TO authenticated
  USING (auth.uid() = player1_id AND status = 'waiting');

-- Enable realtime for duels
ALTER PUBLICATION supabase_realtime ADD TABLE public.dice_duels;
