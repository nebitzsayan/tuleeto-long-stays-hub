-- Fix critical security vulnerability: Remove public access to email addresses in profiles table
-- Drop the dangerous public access policy
DROP POLICY IF EXISTS "Public can view safe profile info only" ON public.profiles;

-- Create a restricted policy that only allows users to see their own full profile
-- Public users should use the public_profiles_safe view instead
CREATE POLICY "Users can only view their own full profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

-- Ensure the public_profiles_safe view exists and is properly configured
-- This view excludes sensitive information like email addresses
CREATE OR REPLACE VIEW public.public_profiles_safe AS
SELECT 
    id,
    created_at,
    full_name,
    avatar_url
FROM public.profiles;

-- Grant public access to the safe view only
GRANT SELECT ON public.public_profiles_safe TO anon;
GRANT SELECT ON public.public_profiles_safe TO authenticated;

-- Create a security definer function for safe profile access
CREATE OR REPLACE FUNCTION public.get_safe_profile_data(profile_id uuid)
RETURNS TABLE(id uuid, created_at timestamp with time zone, full_name text, avatar_url text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.created_at, p.full_name, p.avatar_url
  FROM public.profiles p
  WHERE p.id = profile_id;
$$;

-- Grant access to the function
GRANT EXECUTE ON FUNCTION public.get_safe_profile_data(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.get_safe_profile_data(uuid) TO authenticated;