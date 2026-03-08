
-- Game state table
CREATE TABLE public.game_state (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  coins BIGINT NOT NULL DEFAULT 0,
  clicker_earnings BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.game_state ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own game state" ON public.game_state FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own game state" ON public.game_state FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own game state" ON public.game_state FOR UPDATE USING (auth.uid() = user_id);

-- Pickaxes table
CREATE TABLE public.pickaxes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL DEFAULT 'normal',
  name TEXT NOT NULL DEFAULT 'Pickaxe',
  used BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.pickaxes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own pickaxes" ON public.pickaxes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own pickaxes" ON public.pickaxes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own pickaxes" ON public.pickaxes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own pickaxes" ON public.pickaxes FOR DELETE USING (auth.uid() = user_id);

-- Crystals table
CREATE TABLE public.crystals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  red INTEGER NOT NULL DEFAULT 0,
  green INTEGER NOT NULL DEFAULT 0,
  blue INTEGER NOT NULL DEFAULT 0,
  rarity INTEGER NOT NULL DEFAULT 0,
  price INTEGER NOT NULL DEFAULT 0,
  color TEXT NOT NULL DEFAULT '#000000',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.crystals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own crystals" ON public.crystals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own crystals" ON public.crystals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own crystals" ON public.crystals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own crystals" ON public.crystals FOR DELETE USING (auth.uid() = user_id);

-- Daily rewards table
CREATE TABLE public.daily_rewards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  reward_date DATE NOT NULL DEFAULT CURRENT_DATE,
  claimed BOOLEAN NOT NULL DEFAULT false,
  reward_type TEXT NOT NULL DEFAULT 'pickaxe',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, reward_date)
);
ALTER TABLE public.daily_rewards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own daily rewards" ON public.daily_rewards FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own daily rewards" ON public.daily_rewards FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own daily rewards" ON public.daily_rewards FOR UPDATE USING (auth.uid() = user_id);

-- Admin links table
CREATE TABLE public.admin_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL DEFAULT 'normal',
  name TEXT NOT NULL DEFAULT '',
  used BOOLEAN NOT NULL DEFAULT false,
  value INTEGER,
  used_by UUID REFERENCES auth.users(id),
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.admin_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view admin links" ON public.admin_links FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anyone can insert admin links" ON public.admin_links FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Anyone can update admin links" ON public.admin_links FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Anyone can delete admin links" ON public.admin_links FOR DELETE TO authenticated USING (true);

-- Special codes table
CREATE TABLE public.special_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  code TEXT NOT NULL,
  used_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, code, used_date)
);
ALTER TABLE public.special_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own special codes" ON public.special_codes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own special codes" ON public.special_codes FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Auto-create game_state on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.game_state (user_id, coins, clicker_earnings)
  VALUES (NEW.id, 0, 0);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
