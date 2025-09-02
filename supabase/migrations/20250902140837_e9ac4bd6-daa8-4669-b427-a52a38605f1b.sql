-- Fix the search path issue in the handle_new_user function
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Fix the update function as well
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = '';