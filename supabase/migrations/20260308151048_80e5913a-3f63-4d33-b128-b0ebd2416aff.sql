
-- Remap old pickaxe type names to new ones
UPDATE public.pickaxes SET type = 'normal' WHERE type = 'common';
UPDATE public.pickaxes SET type = 'rare' WHERE type = 'epic';
UPDATE public.pickaxes SET type = 'epic' WHERE type = 'legendary';
UPDATE public.pickaxes SET type = 'mythic' WHERE type = 'demonic';
UPDATE public.pickaxes SET type = 'legendary' WHERE type = 'silent';

-- Same for admin_links
UPDATE public.admin_links SET type = 'normal' WHERE type = 'common';
UPDATE public.admin_links SET type = 'rare' WHERE type = 'epic';
UPDATE public.admin_links SET type = 'epic' WHERE type = 'legendary';
UPDATE public.admin_links SET type = 'mythic' WHERE type = 'demonic';
UPDATE public.admin_links SET type = 'legendary' WHERE type = 'silent';

-- Create atomic redeem function
CREATE OR REPLACE FUNCTION public.redeem_admin_link(p_code text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_link admin_links;
BEGIN
  UPDATE admin_links
  SET used = true, used_by = auth.uid(), used_at = now()
  WHERE code = p_code AND used = false
  RETURNING * INTO v_link;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'invalid_or_used_code';
  END IF;

  -- If coins type, add coins to game_state
  IF v_link.type = 'coins' THEN
    UPDATE game_state
    SET coins = coins + COALESCE(v_link.value, 100), updated_at = now()
    WHERE user_id = auth.uid();
  ELSE
    -- Insert pickaxe
    INSERT INTO pickaxes (user_id, type, name, used)
    VALUES (auth.uid(), v_link.type, initcap(v_link.type) || ' Pickaxe', false);
  END IF;

  RETURN row_to_json(v_link);
END;
$$;

-- Fix admin_links RLS: only admins can insert/update/delete
DROP POLICY IF EXISTS "Anyone can delete admin links" ON public.admin_links;
DROP POLICY IF EXISTS "Anyone can insert admin links" ON public.admin_links;
DROP POLICY IF EXISTS "Anyone can update admin links" ON public.admin_links;
DROP POLICY IF EXISTS "Anyone can view admin links" ON public.admin_links;

CREATE POLICY "Anyone can view admin links" ON public.admin_links
  FOR SELECT USING (true);

CREATE POLICY "Admins can insert admin links" ON public.admin_links
  FOR INSERT WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "Admins can update admin links" ON public.admin_links
  FOR UPDATE USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "Admins can delete admin links" ON public.admin_links
  FOR DELETE USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
