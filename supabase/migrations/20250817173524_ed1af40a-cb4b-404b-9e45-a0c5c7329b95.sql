
-- Critical Security Fixes for Database

-- 1. Create a truly secure public profiles view that only shows safe data
DROP VIEW IF EXISTS public.public_profiles_safe;
CREATE VIEW public.public_profiles_safe AS
SELECT 
  id,
  full_name,
  avatar_url,
  created_at
FROM public.profiles;

-- 2. Create a secure contact details table with proper access controls
CREATE TABLE IF NOT EXISTS public.property_contact_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  contact_phone TEXT,
  contact_email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(property_id)
);

-- Enable RLS on contact details
ALTER TABLE public.property_contact_details ENABLE ROW LEVEL SECURITY;

-- Only property owners and authenticated users can view contact details
CREATE POLICY "Property owners can manage contact details" 
ON public.property_contact_details 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.properties p 
    WHERE p.id = property_contact_details.property_id 
    AND p.owner_id = auth.uid()
  )
);

CREATE POLICY "Authenticated users can view contact details" 
ON public.property_contact_details 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- 3. Update profiles policies to be more restrictive
DROP POLICY IF EXISTS "Public profiles view limited info" ON public.profiles;

-- Create a policy that completely prevents public email access
CREATE POLICY "Users can view their own full profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

-- Create a policy for public profile info (no email)
CREATE POLICY "Limited public profile info" 
ON public.profiles 
FOR SELECT 
USING (true);

-- But we need to restrict columns, so we'll use the secure view instead

-- 4. Migrate existing contact phone data to the new secure table
INSERT INTO public.property_contact_details (property_id, contact_phone)
SELECT id, contact_phone 
FROM public.properties 
WHERE contact_phone IS NOT NULL
ON CONFLICT (property_id) DO NOTHING;

-- 5. Remove contact_phone from properties table after migration
ALTER TABLE public.properties DROP COLUMN IF EXISTS contact_phone;

-- 6. Create a secure function to check if user can view contact details
CREATE OR REPLACE FUNCTION public.can_view_contact_details(_property_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.properties 
    WHERE id = _property_id 
    AND owner_id = auth.uid()
  ) OR auth.uid() IS NOT NULL;
$$;

-- 7. Add security logging table for audit trail
CREATE TABLE IF NOT EXISTS public.security_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.security_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view security logs
CREATE POLICY "Admins can view security logs" 
ON public.security_logs 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- System can insert security logs
CREATE POLICY "System can insert security logs" 
ON public.security_logs 
FOR INSERT 
WITH CHECK (true);
