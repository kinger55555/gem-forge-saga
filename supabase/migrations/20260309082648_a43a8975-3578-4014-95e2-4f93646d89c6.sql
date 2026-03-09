
-- Fix 1: Restrict admin_links SELECT policy
DROP POLICY IF EXISTS "Anyone can view admin links" ON admin_links;

CREATE POLICY "Admins can view admin links"
  ON admin_links FOR SELECT
  TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "Users can view own redeemed links"
  ON admin_links FOR SELECT
  TO authenticated
  USING (auth.uid() = used_by);

-- Fix 2: Add trigger to enforce crystal price from rarity server-side
CREATE OR REPLACE FUNCTION public.enforce_crystal_price()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  IF NEW.red = 255 AND NEW.green = 255 AND NEW.blue = 255 THEN
    NEW.price := 500000;
  ELSIF NEW.red = 0 AND NEW.green = 0 AND NEW.blue = 0 THEN
    NEW.price := 500000;
  ELSE
    NEW.price := 5 * power(10, NEW.rarity)::bigint;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE TRIGGER enforce_crystal_price_trigger
  BEFORE INSERT OR UPDATE ON crystals
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_crystal_price();
