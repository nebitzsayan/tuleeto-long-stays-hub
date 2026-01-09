-- Create property_reports table
CREATE TABLE public.property_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  reporter_id UUID NOT NULL,
  reason TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Unique constraint: one user can only report a property once
ALTER TABLE property_reports ADD CONSTRAINT unique_user_property_report UNIQUE (property_id, reporter_id);

-- Add report_count column to properties
ALTER TABLE properties ADD COLUMN IF NOT EXISTS report_count INTEGER DEFAULT 0;

-- Enable RLS
ALTER TABLE property_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can create reports" ON property_reports FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Users can view their own reports" ON property_reports FOR SELECT
  USING (auth.uid() = reporter_id);

CREATE POLICY "Admins can view all reports" ON property_reports FOR SELECT
  USING (is_current_user_admin());

CREATE POLICY "Admins can update reports" ON property_reports FOR UPDATE
  USING (is_current_user_admin());

CREATE POLICY "Admins can delete reports" ON property_reports FOR DELETE
  USING (is_current_user_admin());

-- Trigger function to auto-flag property after 3 reports
CREATE OR REPLACE FUNCTION check_property_report_count()
RETURNS TRIGGER AS $$
DECLARE
  report_count_val INTEGER;
BEGIN
  SELECT COUNT(DISTINCT reporter_id) INTO report_count_val 
  FROM property_reports 
  WHERE property_id = NEW.property_id;
  
  UPDATE properties 
  SET 
    report_count = report_count_val,
    is_public = CASE WHEN report_count_val >= 3 THEN false ELSE is_public END,
    is_flagged = CASE WHEN report_count_val >= 3 THEN true ELSE is_flagged END,
    flag_reason = CASE WHEN report_count_val >= 3 THEN 'Auto-flagged: 3+ user reports' ELSE flag_reason END
  WHERE id = NEW.property_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger
CREATE TRIGGER on_property_report_inserted
AFTER INSERT ON property_reports
FOR EACH ROW EXECUTE FUNCTION check_property_report_count();