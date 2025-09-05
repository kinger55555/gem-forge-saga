-- Create daily rewards table
CREATE TABLE public.daily_rewards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  reward_date DATE NOT NULL DEFAULT CURRENT_DATE,
  claimed BOOLEAN NOT NULL DEFAULT false,
  reward_type TEXT NOT NULL DEFAULT 'pickaxe',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, reward_date)
);

-- Enable RLS
ALTER TABLE public.daily_rewards ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own daily rewards" 
ON public.daily_rewards 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own daily rewards" 
ON public.daily_rewards 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own daily rewards" 
ON public.daily_rewards 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create special codes table for mod67 tracking
CREATE TABLE public.special_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  code TEXT NOT NULL,
  used_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, code, used_date)
);

-- Enable RLS
ALTER TABLE public.special_codes ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own special codes" 
ON public.special_codes 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own special codes" 
ON public.special_codes 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);