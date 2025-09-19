-- Allow users to delete their own pickaxes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'pickaxes' 
      AND policyname = 'Users can delete their own pickaxes'
  ) THEN
    CREATE POLICY "Users can delete their own pickaxes"
    ON public.pickaxes
    FOR DELETE
    USING (auth.uid() = user_id);
  END IF;
END $$;