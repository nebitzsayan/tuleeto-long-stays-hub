-- Create function to update timestamps (if not exists)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create tenants table
CREATE TABLE public.tenants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT NOT NULL,
  room_number TEXT,
  move_in_date DATE NOT NULL,
  move_out_date DATE,
  monthly_rent NUMERIC NOT NULL,
  security_deposit NUMERIC DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create payment_records table for monthly tracking
CREATE TABLE public.payment_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  year INTEGER NOT NULL CHECK (year >= 2000),
  rent_paid BOOLEAN DEFAULT false,
  rent_amount NUMERIC DEFAULT 0,
  rent_paid_date DATE,
  electricity_paid BOOLEAN DEFAULT false,
  electricity_amount NUMERIC DEFAULT 0,
  electricity_paid_date DATE,
  water_paid BOOLEAN DEFAULT false,
  water_amount NUMERIC DEFAULT 0,
  water_paid_date DATE,
  other_charges NUMERIC DEFAULT 0,
  other_charges_description TEXT,
  remarks TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, month, year)
);

-- Enable RLS
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_records ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tenants
CREATE POLICY "Property owners can view their tenants"
ON public.tenants FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.properties
    WHERE properties.id = tenants.property_id
    AND properties.owner_id = auth.uid()
  )
);

CREATE POLICY "Property owners can insert tenants"
ON public.tenants FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.properties
    WHERE properties.id = tenants.property_id
    AND properties.owner_id = auth.uid()
  )
);

CREATE POLICY "Property owners can update their tenants"
ON public.tenants FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.properties
    WHERE properties.id = tenants.property_id
    AND properties.owner_id = auth.uid()
  )
);

CREATE POLICY "Property owners can delete their tenants"
ON public.tenants FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.properties
    WHERE properties.id = tenants.property_id
    AND properties.owner_id = auth.uid()
  )
);

-- RLS Policies for payment_records
CREATE POLICY "Property owners can view payment records"
ON public.payment_records FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.tenants
    JOIN public.properties ON properties.id = tenants.property_id
    WHERE tenants.id = payment_records.tenant_id
    AND properties.owner_id = auth.uid()
  )
);

CREATE POLICY "Property owners can insert payment records"
ON public.payment_records FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.tenants
    JOIN public.properties ON properties.id = tenants.property_id
    WHERE tenants.id = payment_records.tenant_id
    AND properties.owner_id = auth.uid()
  )
);

CREATE POLICY "Property owners can update payment records"
ON public.payment_records FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.tenants
    JOIN public.properties ON properties.id = tenants.property_id
    WHERE tenants.id = payment_records.tenant_id
    AND properties.owner_id = auth.uid()
  )
);

CREATE POLICY "Property owners can delete payment records"
ON public.payment_records FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.tenants
    JOIN public.properties ON properties.id = tenants.property_id
    WHERE tenants.id = payment_records.tenant_id
    AND properties.owner_id = auth.uid()
  )
);

-- Create trigger for updated_at on tenants
CREATE TRIGGER update_tenants_updated_at
BEFORE UPDATE ON public.tenants
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for updated_at on payment_records
CREATE TRIGGER update_payment_records_updated_at
BEFORE UPDATE ON public.payment_records
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();