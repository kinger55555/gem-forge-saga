-- Update admin_links table constraint to support all link types
ALTER TABLE admin_links DROP CONSTRAINT admin_links_type_check;

-- Add new constraint that supports all admin link types
ALTER TABLE admin_links ADD CONSTRAINT admin_links_type_check 
CHECK (type = ANY (ARRAY['normal'::text, 'legendary'::text, 'coins'::text, 'case'::text]));