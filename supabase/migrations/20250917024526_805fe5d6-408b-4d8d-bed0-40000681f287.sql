-- Fix critical security vulnerability: Remove public access to email addresses in profiles table
-- Drop the dangerous public access policy
DROP POLICY IF EXISTS "Public can view safe profile info only" ON public.profiles;

-- Create a restricted policy that only allows users to see their own full profile
CREATE POLICY "Users can only view their own full profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

-- Drop and recreate the public_profiles_safe view to ensure correct structure
DROP VIEW IF EXISTS public.public_profiles_safe CASCADE;
DROP VIEW IF EXISTS public.public_profiles CASCADE;

-- Create the safe public view that excludes email addresses
CREATE VIEW public.public_profiles_safe AS
SELECT 
    id,
    created_at,
    full_name,
    avatar_url
FROM public.profiles;

-- Create an alias view for consistency
CREATE VIEW public.public_profiles AS
SELECT 
    id,
    created_at,
    full_name,
    avatar_url
FROM public.profiles;

-- Grant public access to the safe views only
GRANT SELECT ON public.public_profiles_safe TO anon;
GRANT SELECT ON public.public_profiles_safe TO authenticated;
GRANT SELECT ON public.public_profiles TO anon;
GRANT SELECT ON public.public_profiles TO authenticated;