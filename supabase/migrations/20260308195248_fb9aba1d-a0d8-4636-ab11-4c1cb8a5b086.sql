
-- Crystal gifts table for sharing crystals via links
CREATE TABLE public.crystal_gifts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(8), 'hex'),
  sender_id uuid NOT NULL,
  red integer NOT NULL DEFAULT 0,
  green integer NOT NULL DEFAULT 0,
  blue integer NOT NULL DEFAULT 0,
  rarity integer NOT NULL DEFAULT 0,
  price integer NOT NULL DEFAULT 0,
  color text NOT NULL DEFAULT '#000000',
  used boolean NOT NULL DEFAULT false,
  used_by uuid,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.crystal_gifts ENABLE ROW LEVEL SECURITY;

-- Sender can view own gifts
CREATE POLICY "Users can view own sent gifts"
  ON public.crystal_gifts FOR SELECT
  USING (auth.uid() = sender_id);

-- Anyone authenticated can view by code (for redemption)
CREATE POLICY "Authenticated users can view gifts by code"
  ON public.crystal_gifts FOR SELECT
  TO authenticated
  USING (true);

-- Users can insert own gifts
CREATE POLICY "Users can insert own gifts"
  ON public.crystal_gifts FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

-- Add crystal columns to admin_links for crystal-type links
ALTER TABLE public.admin_links
  ADD COLUMN IF NOT EXISTS crystal_red integer,
  ADD COLUMN IF NOT EXISTS crystal_green integer,
  ADD COLUMN IF NOT EXISTS crystal_blue integer;

-- Function to redeem crystal gift
CREATE OR REPLACE FUNCTION public.redeem_crystal_gift(p_code text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_gift crystal_gifts;
BEGIN
  UPDATE crystal_gifts
  SET used = true, used_by = auth.uid(), used_at = now()
  WHERE code = p_code AND used = false AND sender_id != auth.uid()
  RETURNING * INTO v_gift;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'invalid_or_used_gift';
  END IF;

  -- Insert crystal for receiver
  INSERT INTO crystals (user_id, red, green, blue, rarity, price, color)
  VALUES (auth.uid(), v_gift.red, v_gift.green, v_gift.blue, v_gift.rarity, v_gift.price, v_gift.color);

  RETURN json_build_object(
    'success', true,
    'red', v_gift.red,
    'green', v_gift.green,
    'blue', v_gift.blue,
    'rarity', v_gift.rarity,
    'price', v_gift.price,
    'color', v_gift.color
  );
END;
$$;

-- Update redeem_admin_link to handle crystal type
CREATE OR REPLACE FUNCTION public.redeem_admin_link(p_code text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_link admin_links;
  v_crystal_red integer;
  v_crystal_green integer;
  v_crystal_blue integer;
  v_rarity integer;
  v_price integer;
  v_color text;
BEGIN
  UPDATE admin_links
  SET used = true, used_by = auth.uid(), used_at = now()
  WHERE code = p_code AND used = false
  RETURNING * INTO v_link;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'invalid_or_used_code';
  END IF;

  IF v_link.type = 'coins' THEN
    UPDATE game_state
    SET coins = coins + COALESCE(v_link.value, 100), updated_at = now()
    WHERE user_id = auth.uid();
  ELSIF v_link.type = 'crystal' THEN
    -- Crystal link: use provided RGB or generate from rarity
    v_crystal_red := COALESCE(v_link.crystal_red, floor(random() * 256)::integer);
    v_crystal_green := COALESCE(v_link.crystal_green, floor(random() * 256)::integer);
    v_crystal_blue := COALESCE(v_link.crystal_blue, floor(random() * 256)::integer);
    v_rarity := COALESCE(v_link.value, 0);
    v_price := 5 * power(10, v_rarity)::integer;
    v_color := 'rgb(' || v_crystal_red || ', ' || v_crystal_green || ', ' || v_crystal_blue || ')';

    INSERT INTO crystals (user_id, red, green, blue, rarity, price, color)
    VALUES (auth.uid(), v_crystal_red, v_crystal_green, v_crystal_blue, v_rarity, v_price, v_color);
  ELSE
    -- Pickaxe
    INSERT INTO pickaxes (user_id, type, name, used)
    VALUES (auth.uid(), v_link.type, initcap(v_link.type) || ' Pickaxe', false);
  END IF;

  RETURN row_to_json(v_link);
END;
$$;
