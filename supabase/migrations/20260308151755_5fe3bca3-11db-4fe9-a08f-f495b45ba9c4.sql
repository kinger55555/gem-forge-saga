
-- Set admin role for the user
UPDATE auth.users 
SET raw_app_meta_data = raw_app_meta_data || '{"role": "admin"}'::jsonb
WHERE id = '1f6acadb-c312-4d48-b5c2-50799ef4bb66';
