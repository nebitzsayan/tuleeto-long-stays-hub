-- Add admin role for user sayangayan4976@gmail.com
INSERT INTO public.user_roles (user_id, role)
VALUES ('a8bac681-0d89-4e1a-beef-2563255c6c37', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;