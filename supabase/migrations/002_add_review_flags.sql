-- Add review_flags column to receipts table
-- This stores an array of field names that the AI flagged for user review

ALTER TABLE receipts
ADD COLUMN IF NOT EXISTS review_flags JSONB DEFAULT '[]'::JSONB;

-- Add comment for documentation
COMMENT ON COLUMN receipts.review_flags IS 'Array of field names flagged for review: merchant_name, merchant_address, transaction_date, subtotal, tax, total, category, line_items';
