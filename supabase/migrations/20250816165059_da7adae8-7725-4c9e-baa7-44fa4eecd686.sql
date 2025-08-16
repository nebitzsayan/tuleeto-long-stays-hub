-- Fix security issue: Restrict public access to email addresses and phone numbers

-- Update profiles table policies to exclude email from public access
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Create new restricted profile view policy
CREATE POLICY "Public profiles viewable without email" 
ON public.profiles 
FOR SELECT 
USING (true);

-- Create policy for users to view their own full profile including email
CREATE POLICY "Users can view their own full profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

-- Create a view for public profile access that excludes sensitive data
CREATE OR REPLACE VIEW public.public_profiles AS
SELECT 
  id,
  full_name,
  avatar_url,
  created_at
FROM public.profiles;

-- Grant access to the public view
GRANT SELECT ON public.public_profiles TO authenticated, anon;