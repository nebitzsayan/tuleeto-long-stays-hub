-- Fix the recursive RLS policy issue by updating the admin check policy

-- Drop the problematic recursive policy
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;

-- Create a new non-recursive policy using the security definer function
CREATE POLICY "Admins can view all roles" 
ON public.user_roles 
FOR SELECT 
USING (
  public.has_role(auth.uid(), 'admin') OR auth.uid() = user_id
);

-- Update the user_roles policy to also use the security definer function
DROP POLICY IF EXISTS "Users can view their own role only" ON public.user_roles;

-- Create a simple policy that just allows users to see their own role
CREATE POLICY "Users can view their own role" 
ON public.user_roles 
FOR SELECT 
USING (auth.uid() = user_id);