
-- Add foreign key constraint between properties and profiles tables
ALTER TABLE public.properties 
ADD CONSTRAINT properties_owner_id_fkey 
FOREIGN KEY (owner_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
