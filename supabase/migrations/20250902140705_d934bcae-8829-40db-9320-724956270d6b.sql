-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create pickaxes table to store user pickaxes
CREATE TABLE public.pickaxes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('normal', 'legendary')),
  name TEXT NOT NULL,
  used BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create crystals table to store user crystals
CREATE TABLE public.crystals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  red INTEGER NOT NULL CHECK (red >= 0 AND red <= 255),
  green INTEGER NOT NULL CHECK (green >= 0 AND green <= 255),  
  blue INTEGER NOT NULL CHECK (blue >= 0 AND blue <= 255),
  rarity INTEGER NOT NULL,
  price INTEGER NOT NULL,
  color TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create game_state table to store user game data
CREATE TABLE public.game_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  coins NUMERIC NOT NULL DEFAULT 0,
  clicker_earnings NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create crystal_transfers table for sharing crystals
CREATE TABLE public.crystal_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  to_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  crystal_id UUID NOT NULL REFERENCES public.crystals(id) ON DELETE CASCADE,
  transfer_code TEXT NOT NULL UNIQUE,
  claimed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  claimed_at TIMESTAMPTZ
);

-- Create admin_links table for pickaxe distribution
CREATE TABLE public.admin_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL CHECK (type IN ('normal', 'legendary')),
  name TEXT NOT NULL,
  used BOOLEAN NOT NULL DEFAULT false,
  used_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pickaxes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crystals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crystal_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_links ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Pickaxes policies  
CREATE POLICY "Users can view their own pickaxes" ON public.pickaxes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own pickaxes" ON public.pickaxes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pickaxes" ON public.pickaxes
  FOR UPDATE USING (auth.uid() = user_id);

-- Crystals policies
CREATE POLICY "Users can view their own crystals" ON public.crystals
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own crystals" ON public.crystals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own crystals" ON public.crystals
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own crystals" ON public.crystals
  FOR DELETE USING (auth.uid() = user_id);

-- Game state policies
CREATE POLICY "Users can view their own game state" ON public.game_state
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own game state" ON public.game_state
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own game state" ON public.game_state
  FOR UPDATE USING (auth.uid() = user_id);

-- Crystal transfers policies
CREATE POLICY "Users can view transfers they created or received" ON public.crystal_transfers
  FOR SELECT USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

CREATE POLICY "Users can create transfers for their crystals" ON public.crystal_transfers
  FOR INSERT WITH CHECK (auth.uid() = from_user_id);

CREATE POLICY "Users can update transfers to claim them" ON public.crystal_transfers
  FOR UPDATE USING (auth.uid() = to_user_id OR auth.uid() = from_user_id);

-- Admin links policies (public read for activation)
CREATE POLICY "Anyone can view admin links" ON public.admin_links
  FOR SELECT USING (true);

CREATE POLICY "Admin links can be updated when used" ON public.admin_links
  FOR UPDATE USING (true);

-- Functions and triggers
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_game_state_updated_at
  BEFORE UPDATE ON public.game_state
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, username)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)));
  
  INSERT INTO public.game_state (user_id, coins, clicker_earnings)
  VALUES (NEW.id, 0, 0);
  
  -- Give 3 starter pickaxes
  INSERT INTO public.pickaxes (user_id, type, name, used)
  VALUES 
    (NEW.id, 'normal', 'Normal Pickaxe #1', false),
    (NEW.id, 'normal', 'Normal Pickaxe #2', false),
    (NEW.id, 'legendary', 'Legendary Pickaxe', false);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();