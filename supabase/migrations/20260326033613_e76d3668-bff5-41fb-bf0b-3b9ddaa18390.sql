
-- Fix 1: Recreate views with security_invoker = true (fixes SUPA_security_definer_view)
DROP VIEW IF EXISTS public.public_profiles;
CREATE VIEW public.public_profiles
WITH (security_invoker = true)
AS
SELECT id, created_at, full_name, avatar_url
FROM public.profiles;

DROP VIEW IF EXISTS public.public_profiles_safe;
CREATE VIEW public.public_profiles_safe
WITH (security_invoker = true)
AS
SELECT id, created_at, full_name, avatar_url
FROM public.profiles;

DROP VIEW IF EXISTS public.property_public_view;
CREATE VIEW public.property_public_view
WITH (security_invoker = true)
AS
SELECT
  id, title, description, location, price, bedrooms, bathrooms,
  area, type, features, images, coordinates, available_from,
  owner_id, created_at, is_public,
  CASE
    WHEN auth.uid() IS NOT NULL THEN contact_phone
    ELSE regexp_replace(contact_phone, '(.{3})(.*)(.{2})', '\1****\3', 'g')
  END AS contact_phone
FROM public.properties
WHERE is_public = true;

-- Fix 2: Fix is_current_user_admin() to add SET search_path (fixes search_path hijacking)
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  );
$$;
