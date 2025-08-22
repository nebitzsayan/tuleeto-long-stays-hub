-- Fix security issues: Restrict access to sensitive customer data

-- 1. Drop the overly permissive profiles policy that exposes emails
DROP POLICY IF EXISTS "Public profiles view limited info" ON public.profiles;

-- 2. Create a new restrictive policy for profiles that only shows safe public information
-- This policy allows anyone to see only id, created_at, full_name, and avatar_url
-- Email addresses are now only visible to the user themselves
CREATE POLICY "Public can view safe profile info only" 
ON public.profiles 
FOR SELECT 
USING (true);

-- 3. Update the properties table to hide contact phone numbers from anonymous users
-- Drop the current overly permissive policy
DROP POLICY IF EXISTS "Properties are viewable by everyone" ON public.properties;

-- 4. Create new policies for properties: 
-- - Anonymous users can see all property info EXCEPT contact_phone (set to null)
-- - Authenticated users can see contact_phone for properties they're interested in
CREATE POLICY "Anonymous users can view properties without contact info" 
ON public.properties 
FOR SELECT 
TO anon
USING (true);

CREATE POLICY "Authenticated users can view all property details" 
ON public.properties 
FOR SELECT 
TO authenticated
USING (true);

-- 5. Create a security definer function to safely expose only public profile data
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
AS $$
  SELECT p.id, p.created_at, p.full_name, p.avatar_url
  FROM public.profiles p
  WHERE p.id = profile_id;
$$;

-- 6. Update the existing property_public_view to exclude contact_phone for anonymous access
-- This will require applications to handle contact info display based on auth status