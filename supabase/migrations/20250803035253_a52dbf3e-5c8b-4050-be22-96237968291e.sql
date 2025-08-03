
-- Add foreign key constraint to link properties.owner_id to profiles.id
ALTER TABLE public.properties 
ADD CONSTRAINT properties_owner_id_fkey 
FOREIGN KEY (owner_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
