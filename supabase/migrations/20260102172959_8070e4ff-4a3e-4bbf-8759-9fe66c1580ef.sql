-- Add bill_number column to payment_records table
ALTER TABLE payment_records 
ADD COLUMN bill_number TEXT UNIQUE;

-- Create index for faster search
CREATE INDEX idx_payment_records_bill_number 
ON payment_records(bill_number);