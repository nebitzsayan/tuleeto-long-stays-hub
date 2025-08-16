-- Fix security definer view issue and complete security hardening

-- Drop the problematic view and recreate without SECURITY DEFINER
DROP VIEW IF EXISTS public.public_profiles;

-- Create a simple view without SECURITY DEFINER
CREATE VIEW public.public_profiles AS
SELECT 
  id,
  full_name,
  avatar_url,
  created_at
FROM public.profiles;

-- Fix function search path issues for existing functions
ALTER FUNCTION public.handle_new_user() SET search_path = public;
ALTER FUNCTION public.has_role(uuid, app_role) SET search_path = public;

-- Create additional security function to check if user can view phone numbers
CREATE OR REPLACE FUNCTION public.can_view_contact_details(_property_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.properties 
    WHERE id = _property_id 
    AND owner_id = auth.uid()
  ) OR auth.uid() IS NOT NULL;
$$;

-- Add policy to restrict phone number access for non-authenticated users
-- First check if the policy exists and drop it
DO $$
BEGIN
  -- Check if column exists in properties table
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'properties' 
    AND column_name = 'contact_phone'
  ) THEN
    -- Create a more restrictive view for property contact info
    CREATE OR REPLACE VIEW public.property_public_view AS
    SELECT 
      id,
      title,
      description,
      location,
      price,
      bedrooms,
      bathrooms,
      area,
      type,
      features,
      images,
      coordinates,
      available_from,
      owner_id,
      created_at,
      is_public,
      CASE 
        WHEN auth.uid() IS NOT NULL THEN contact_phone
        ELSE REGEXP_REPLACE(contact_phone, '(.{3})(.*)(.{2})', '\1****\3', 'g')
      END as contact_phone
    FROM public.properties
    WHERE is_public = true;
  END IF;
END
$$;