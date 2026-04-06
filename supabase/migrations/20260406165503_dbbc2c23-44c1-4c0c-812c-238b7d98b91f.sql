-- Drop the overly permissive policies that bypass ownership checks
DROP POLICY IF EXISTS "Anyone can delete property images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can update property images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload property images" ON storage.objects;