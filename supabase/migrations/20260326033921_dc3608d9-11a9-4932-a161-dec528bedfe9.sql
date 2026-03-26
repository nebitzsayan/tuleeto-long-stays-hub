
-- Fix 1: Remove duplicate INSERT policy that bypasses owner-exclusion check
DROP POLICY IF EXISTS "Authenticated users can create reviews" ON public.property_reviews;

-- Fix 2: Update the remaining INSERT policy to also enforce user_id = auth.uid()
DROP POLICY IF EXISTS "Users can create reviews for properties they don't own" ON public.property_reviews;
CREATE POLICY "Users can create reviews for properties they don't own"
ON public.property_reviews
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND auth.uid() <> (SELECT owner_id FROM public.properties WHERE id = property_reviews.property_id)
);
