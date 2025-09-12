-- Allow authenticated users to create admin links used for pickaxe codes
CREATE POLICY "Authenticated users can insert admin links"
ON public.admin_links
FOR INSERT
TO authenticated
WITH CHECK (true);