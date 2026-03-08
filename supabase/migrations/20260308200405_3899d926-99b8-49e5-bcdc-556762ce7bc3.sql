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
  v_price bigint;
  v_color text;
  v_rarity_points integer;
  v_unique_count integer;
  v_vals integer[];
  v_val integer;
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
    v_crystal_red := COALESCE(v_link.crystal_red, floor(random() * 256)::integer);
    v_crystal_green := COALESCE(v_link.crystal_green, floor(random() * 256)::integer);
    v_crystal_blue := COALESCE(v_link.crystal_blue, floor(random() * 256)::integer);

    IF v_link.value IS NOT NULL THEN
      v_rarity := v_link.value;
    ELSE
      v_rarity_points := 0;
      v_vals := ARRAY[v_crystal_red, v_crystal_green, v_crystal_blue];
      SELECT count(DISTINCT v) INTO v_unique_count FROM unnest(v_vals) AS v;
      IF v_unique_count = 1 THEN
        v_rarity_points := v_rarity_points + 3;
      ELSIF v_unique_count = 2 THEN
        v_rarity_points := v_rarity_points + 2;
      END IF;
      FOREACH v_val IN ARRAY v_vals LOOP
        IF v_val = 0 OR v_val = 255 THEN
          v_rarity_points := v_rarity_points + 2;
        ELSIF v_val <= 25 OR v_val >= 230 THEN
          v_rarity_points := v_rarity_points + 1;
        END IF;
      END LOOP;
      v_rarity := v_rarity_points;
    END IF;

    v_price := 5 * power(10, v_rarity)::bigint;
    v_color := 'rgb(' || v_crystal_red || ', ' || v_crystal_green || ', ' || v_crystal_blue || ')';

    INSERT INTO crystals (user_id, red, green, blue, rarity, price, color)
    VALUES (auth.uid(), v_crystal_red, v_crystal_green, v_crystal_blue, v_rarity, v_price, v_color);
  ELSE
    INSERT INTO pickaxes (user_id, type, name, used)
    VALUES (auth.uid(), v_link.type, initcap(v_link.type) || ' Pickaxe', false);
  END IF;

  RETURN row_to_json(v_link);
END;
$$;