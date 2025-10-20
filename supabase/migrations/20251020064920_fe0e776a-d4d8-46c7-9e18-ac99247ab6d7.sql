-- Add new columns to profiles table for user management
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_banned boolean DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ban_reason text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_login timestamp with time zone;

-- Add new columns to properties table for property management
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS is_featured boolean DEFAULT false;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS is_flagged boolean DEFAULT false;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS flag_reason text;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS view_count integer DEFAULT 0;

-- Add new columns to property_reviews table for review moderation
ALTER TABLE public.property_reviews ADD COLUMN IF NOT EXISTS is_approved boolean DEFAULT true;
ALTER TABLE public.property_reviews ADD COLUMN IF NOT EXISTS is_flagged boolean DEFAULT false;
ALTER TABLE public.property_reviews ADD COLUMN IF NOT EXISTS flag_reason text;
ALTER TABLE public.property_reviews ADD COLUMN IF NOT EXISTS admin_response text;

-- Create admin_logs table for audit trail
CREATE TABLE IF NOT EXISTS public.admin_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  action_type text NOT NULL,
  target_id uuid,
  target_type text,
  details jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on admin_logs
ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;

-- RLS policy: Only admins can view logs
CREATE POLICY "Admins can view all logs"
ON public.admin_logs
FOR SELECT
TO authenticated
USING (is_current_user_admin());

-- RLS policy: Only admins can insert logs
CREATE POLICY "Admins can insert logs"
ON public.admin_logs
FOR INSERT
TO authenticated
WITH CHECK (is_current_user_admin());

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_admin_logs_admin_id ON public.admin_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_created_at ON public.admin_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_logs_action_type ON public.admin_logs(action_type);

-- Update RLS policies for profiles to allow admin full access
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (is_current_user_admin());

CREATE POLICY "Admins can update any profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (is_current_user_admin());

CREATE POLICY "Admins can delete any profile"
ON public.profiles
FOR DELETE
TO authenticated
USING (is_current_user_admin());

-- Function to log admin actions
CREATE OR REPLACE FUNCTION public.log_admin_action(
  _action_type text,
  _target_id uuid DEFAULT NULL,
  _target_type text DEFAULT NULL,
  _details jsonb DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF is_current_user_admin() THEN
    INSERT INTO public.admin_logs (admin_id, action_type, target_id, target_type, details)
    VALUES (auth.uid(), _action_type, _target_id, _target_type, _details);
  END IF;
END;
$$;