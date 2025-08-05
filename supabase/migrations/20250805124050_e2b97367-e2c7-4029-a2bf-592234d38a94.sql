
-- Create wishlist table for users to save properties
CREATE TABLE public.wishlists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, property_id)
);

-- Enable RLS for wishlist table
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own wishlists
CREATE POLICY "Users can view their own wishlists" 
  ON public.wishlists 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Allow users to add properties to their wishlist
CREATE POLICY "Users can add to their wishlist" 
  ON public.wishlists 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Allow users to remove properties from their wishlist
CREATE POLICY "Users can remove from their wishlist" 
  ON public.wishlists 
  FOR DELETE 
  USING (auth.uid() = user_id);
