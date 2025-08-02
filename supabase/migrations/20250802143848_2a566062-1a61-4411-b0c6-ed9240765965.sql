
-- Add coordinates column to properties table to store lat/lng data
ALTER TABLE properties 
ADD COLUMN coordinates jsonb;

-- Add a comment to describe the column
COMMENT ON COLUMN properties.coordinates IS 'JSON object containing lat and lng coordinates for property location';
