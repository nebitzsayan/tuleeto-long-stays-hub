-- Fix function search path security issue
CREATE OR REPLACE FUNCTION public.get_safe_profile_data(profile_id uuid)
RETURNS TABLE (
  id uuid,
  created_at timestamp with time zone,
  full_name text,
  avatar_url text
) 
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path TO 'public'
AS $$
  SELECT p.id, p.created_at, p.full_name, p.avatar_url
  FROM public.profiles p
  WHERE p.id = profile_id;
$$;