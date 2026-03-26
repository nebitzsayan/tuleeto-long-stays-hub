
-- Fix 1: Lock down user_roles table - restrict INSERT/UPDATE/DELETE to admins only
-- This prevents privilege escalation where any authenticated user could grant themselves admin

CREATE POLICY "Only admins can insert roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (is_current_user_admin());

CREATE POLICY "Only admins can update roles"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (is_current_user_admin())
WITH CHECK (is_current_user_admin());

CREATE POLICY "Only admins can delete roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (is_current_user_admin());

-- Fix 2: Restrict anonymous access to contact_phone column on properties
-- RLS cannot filter columns, so we use column-level privileges
-- First revoke all SELECT from anon on properties, then grant back only non-sensitive columns
REVOKE SELECT ON public.properties FROM anon;

GRANT SELECT (
  id, title, description, location, type, price, bedrooms, bathrooms, 
  area, available_from, owner_id, created_at, is_public, coordinates, 
  is_featured, is_flagged, view_count, report_count, features, 
  flag_reason, images
) ON public.properties TO anon;
