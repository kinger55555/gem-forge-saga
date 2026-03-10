-- Create mod_transfers table
CREATE TABLE public.mod_transfers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mod_user_id uuid NOT NULL,
  target_user_id uuid NOT NULL,
  amount integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.mod_transfers ENABLE ROW LEVEL SECURITY;

-- Moderators can insert their own transfers
CREATE POLICY "Mods can insert own transfers"
ON public.mod_transfers
FOR INSERT
TO authenticated
WITH CHECK (
  mod_user_id = auth.uid()
  AND (
    ((auth.jwt() -> 'app_metadata') ->> 'role') = 'moderator'
    OR ((auth.jwt() -> 'app_metadata') ->> 'role') = 'admin'
  )
);

-- Mods can view own transfers
CREATE POLICY "Mods can view own transfers"
ON public.mod_transfers
FOR SELECT
TO authenticated
USING (mod_user_id = auth.uid());

-- Admins can view all transfers
CREATE POLICY "Admins can view all transfers"
ON public.mod_transfers
FOR SELECT
TO authenticated
USING (((auth.jwt() -> 'app_metadata') ->> 'role') = 'admin');

-- send_mod_coins function
CREATE OR REPLACE FUNCTION public.send_mod_coins(p_target_email text, p_amount integer)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_role text;
  v_target_user_id uuid;
  v_already_sent integer;
  v_mod_coins numeric;
  v_sendable_limit numeric;
BEGIN
  -- Check caller role
  v_role := (auth.jwt() -> 'app_metadata') ->> 'role';
  IF v_role IS NULL OR (v_role != 'moderator' AND v_role != 'admin') THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;

  -- Find target user by email
  SELECT id INTO v_target_user_id
  FROM auth.users
  WHERE email = p_target_email;

  IF v_target_user_id IS NULL THEN
    RAISE EXCEPTION 'user_not_found';
  END IF;

  IF v_target_user_id = auth.uid() THEN
    RAISE EXCEPTION 'cannot_send_to_self';
  END IF;

  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'invalid_amount';
  END IF;

  -- Check 5% sendable limit for moderators (skip for admins)
  IF v_role = 'moderator' THEN
    -- Get moderator's current coins
    SELECT COALESCE(coins, 0) INTO v_mod_coins
    FROM game_state
    WHERE user_id = auth.uid();

    -- Calculate 5% of their coins as sendable limit
    v_sendable_limit := FLOOR(v_mod_coins * 0.05);

    -- Get how much they've already sent today
    SELECT COALESCE(SUM(amount), 0) INTO v_already_sent
    FROM mod_transfers
    WHERE mod_user_id = auth.uid()
      AND created_at >= date_trunc('day', now());

    -- Check if they can send this amount
    IF v_already_sent + p_amount > v_sendable_limit THEN
      RAISE EXCEPTION 'daily_limit_exceeded';
    END IF;
  END IF;

  -- Add coins to target
  UPDATE game_state
  SET coins = coins + p_amount, updated_at = now()
  WHERE user_id = v_target_user_id;

  -- If no game_state exists for target, create one
  IF NOT FOUND THEN
    INSERT INTO game_state (user_id, coins, clicker_earnings)
    VALUES (v_target_user_id, p_amount, 0);
  END IF;

  -- Log transfer
  INSERT INTO mod_transfers (mod_user_id, target_user_id, amount)
  VALUES (auth.uid(), v_target_user_id, p_amount);

  RETURN json_build_object(
    'success', true,
    'amount', p_amount,
    'target_email', p_target_email,
    'remaining', CASE WHEN v_role = 'admin' THEN -1 ELSE v_sendable_limit - v_already_sent - p_amount END
  );
END;
$$;
