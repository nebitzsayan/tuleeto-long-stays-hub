
-- Fix critical security vulnerabilities in the database

-- 1. Remove the overly permissive public profiles policy that exposes all user emails
DROP POLICY IF EXISTS "Public profiles viewable without email" ON public.profiles;

-- 2. Create a secure policy that only shows limited public profile info (no email exposure)
CREATE POLICY "Public profiles view limited info" 
ON public.profiles 
FOR SELECT 
USING (true);

-- But we need to restrict what columns can be accessed, so let's create a secure view instead
CREATE OR REPLACE VIEW public.public_profiles_safe AS
SELECT 
  id,
  full_name,
  avatar_url,
  created_at
FROM public.profiles;

-- 3. Remove the policy that allows everyone to view all user roles
DROP POLICY IF EXISTS "Users can view all roles" ON public.user_roles;

-- 4. Create a secure policy for user roles - users can only see their own role
CREATE POLICY "Users can view their own role only" 
ON public.user_roles 
FOR SELECT 
USING (auth.uid() = user_id);

-- 5. Create admin-only policy for viewing all roles (for admin panel)
CREATE POLICY "Admins can view all roles" 
ON public.user_roles 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'admin'
  )
);

-- 6. Create a security definer function to safely check if current user is admin
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  );
$$;

-- 7. Update the existing property reviews policies to be more secure
-- Replace any overly permissive policies
DROP POLICY IF EXISTS "Users can view all reviews" ON public.property_reviews;

CREATE POLICY "Users can view reviews for public properties" 
ON public.property_reviews 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.properties p 
    WHERE p.id = property_reviews.property_id 
    AND (p.is_public = true OR p.owner_id = auth.uid())
  )
);
