
-- Drop the existing foreign key constraint that points to auth.users
ALTER TABLE public.properties 
DROP CONSTRAINT IF EXISTS properties_owner_id_fkey;

-- Create a new foreign key constraint pointing to public.profiles
ALTER TABLE public.properties 
ADD CONSTRAINT properties_owner_id_fkey 
FOREIGN KEY (owner_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
