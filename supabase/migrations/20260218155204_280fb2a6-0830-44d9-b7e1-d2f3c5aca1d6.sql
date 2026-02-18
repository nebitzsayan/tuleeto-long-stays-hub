
-- Admin can update any property (for verify, toggle visibility, flag, feature)
CREATE POLICY "Admins can update any property"
ON public.properties
FOR UPDATE
USING (is_current_user_admin());

-- Admin can delete any property
CREATE POLICY "Admins can delete any property"
ON public.properties
FOR DELETE
USING (is_current_user_admin());

-- Admin can update any review (for approve, reject, flag)
CREATE POLICY "Admins can update any review"
ON public.property_reviews
FOR UPDATE
USING (is_current_user_admin());

-- Admin can delete any review
CREATE POLICY "Admins can delete any review"
ON public.property_reviews
FOR DELETE
USING (is_current_user_admin());

-- Admin can view all reviews (including for private properties)
CREATE POLICY "Admins can view all reviews"
ON public.property_reviews
FOR SELECT
USING (is_current_user_admin());
