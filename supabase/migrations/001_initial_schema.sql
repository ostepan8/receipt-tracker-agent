-- Receipt Agent Database Schema
-- Run this migration in your Supabase SQL editor

-- Users table (synced from Clerk)
CREATE TABLE users (
  id TEXT PRIMARY KEY,                    -- Clerk user ID
  email TEXT NOT NULL,
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Receipts table
CREATE TABLE receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- File reference
  storage_path TEXT NOT NULL,             -- Supabase Storage path
  original_filename TEXT,
  file_type TEXT NOT NULL,                -- 'image/jpeg', 'image/png', 'application/pdf'

  -- Extracted data (from Reducto)
  merchant_name TEXT,
  merchant_address TEXT,
  transaction_date DATE,
  subtotal NUMERIC(10, 2),
  tax NUMERIC(10, 2),
  tip NUMERIC(10, 2),
  total NUMERIC(10, 2),
  currency TEXT DEFAULT 'USD',
  payment_method TEXT,                    -- 'credit_card', 'debit_card', 'cash', etc.
  card_last_four TEXT,                    -- Last 4 digits if visible

  -- Line items stored as JSONB array
  -- Each item: { name: string, quantity: number, unit_price: number, total: number }
  line_items JSONB DEFAULT '[]'::JSONB,

  -- Agent-derived fields
  category TEXT,                          -- 'meals', 'travel', 'office_supplies', etc.
  subcategory TEXT,                       -- More granular: 'lunch', 'uber', 'printer_ink'
  agent_notes TEXT,                       -- Any flags or observations from the agent
  confidence_score NUMERIC(3, 2),         -- 0.00 - 1.00, how confident extraction was
  is_duplicate BOOLEAN DEFAULT FALSE,
  duplicate_of UUID REFERENCES receipts(id),

  -- Processing state
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed', 'needs_review'
  error_message TEXT,
  raw_extraction JSONB,                   -- Full Reducto response for debugging

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX idx_receipts_user_id ON receipts(user_id);
CREATE INDEX idx_receipts_user_date ON receipts(user_id, transaction_date DESC);
CREATE INDEX idx_receipts_user_category ON receipts(user_id, category);
CREATE INDEX idx_receipts_status ON receipts(status);

-- Expense reports table
CREATE TABLE expense_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  date_from DATE NOT NULL,
  date_to DATE NOT NULL,
  total NUMERIC(10, 2) NOT NULL,
  category_breakdown JSONB NOT NULL,      -- { "meals": 145.50, "travel": 89.00, ... }
  receipt_ids UUID[] NOT NULL,            -- Array of receipt IDs in this report
  status TEXT DEFAULT 'draft',            -- 'draft', 'finalized'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_reports_user_id ON expense_reports(user_id);

-- Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Note: Since we use Clerk (not Supabase Auth), these policies work with service role key
-- The API routes manually scope queries by user_id from Clerk's auth()

-- Users can only see their own data
CREATE POLICY "Users can view own data"
  ON users FOR SELECT
  USING (true);  -- Service role bypasses RLS, this is for documentation

CREATE POLICY "Users can manage own receipts"
  ON receipts FOR ALL
  USING (true)  -- Service role bypasses RLS
  WITH CHECK (true);

CREATE POLICY "Users can manage own reports"
  ON expense_reports FOR ALL
  USING (true)  -- Service role bypasses RLS
  WITH CHECK (true);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_receipts_updated_at
  BEFORE UPDATE ON receipts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_expense_reports_updated_at
  BEFORE UPDATE ON expense_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
