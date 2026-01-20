-- Vercel Postgres Schema for JUDY Invoice Generator

-- Law Firms table
CREATE TABLE IF NOT EXISTS law_firms (
  id SERIAL PRIMARY KEY,
  firm_name VARCHAR(255) NOT NULL,
  street_address VARCHAR(255),
  city VARCHAR(100),
  email VARCHAR(255) NOT NULL,
  cc_emails TEXT,
  bcc_emails TEXT,
  include_default_bcc BOOLEAN DEFAULT true,
  plan_type VARCHAR(20) DEFAULT 'standard',
  plan_duration VARCHAR(50) DEFAULT '12 months',
  num_users INTEGER DEFAULT 1,
  subscription_start DATE,
  subscription_end DATE,
  base_price DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add cc_emails column if it doesn't exist (for existing databases)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'law_firms' AND column_name = 'cc_emails') THEN
    ALTER TABLE law_firms ADD COLUMN cc_emails TEXT;
  END IF;
END $$;

-- Add bcc_emails column if it doesn't exist (for existing databases)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'law_firms' AND column_name = 'bcc_emails') THEN
    ALTER TABLE law_firms ADD COLUMN bcc_emails TEXT;
  END IF;
END $$;

-- Add include_default_bcc column if it doesn't exist (for existing databases)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'law_firms' AND column_name = 'include_default_bcc') THEN
    ALTER TABLE law_firms ADD COLUMN include_default_bcc BOOLEAN DEFAULT true;
  END IF;
END $$;

-- Add plan_duration column if it doesn't exist (for existing databases)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'law_firms' AND column_name = 'plan_duration') THEN
    ALTER TABLE law_firms ADD COLUMN plan_duration VARCHAR(50) DEFAULT '12 months';
  END IF;
END $$;

-- Invoices table
CREATE TABLE IF NOT EXISTS invoices (
  id SERIAL PRIMARY KEY,
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  firm_id INTEGER REFERENCES law_firms(id) ON DELETE SET NULL,
  plan_type VARCHAR(20),
  duration VARCHAR(50),
  num_users INTEGER DEFAULT 1,
  base_amount DECIMAL(10,2),
  subtotal DECIMAL(10,2),
  gtfl DECIMAL(10,2),
  nihl DECIMAL(10,2),
  vat DECIMAL(10,2),
  total DECIMAL(10,2),
  due_date DATE,
  status VARCHAR(20) DEFAULT 'draft',
  sent_at TIMESTAMP,
  additional_emails TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add additional_emails column if it doesn't exist (for existing databases)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'additional_emails') THEN
    ALTER TABLE invoices ADD COLUMN additional_emails TEXT;
  END IF;
END $$;

-- Scheduled Invoices table
CREATE TABLE IF NOT EXISTS scheduled_invoices (
  id SERIAL PRIMARY KEY,
  firm_id INTEGER REFERENCES law_firms(id) ON DELETE CASCADE,
  schedule_date DATE NOT NULL,
  plan_type VARCHAR(20),
  duration VARCHAR(50),
  num_users INTEGER DEFAULT 1,
  base_amount DECIMAL(10,2),
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  executed_at TIMESTAMP
);

-- Email Config table (single row)
CREATE TABLE IF NOT EXISTS email_config (
  id INTEGER PRIMARY KEY DEFAULT 1,
  smtp_host VARCHAR(255),
  smtp_port INTEGER DEFAULT 587,
  smtp_user VARCHAR(255),
  smtp_pass VARCHAR(255),
  from_email VARCHAR(255),
  from_name VARCHAR(255) DEFAULT 'JUDY Legal Research',
  accountant_email VARCHAR(255),
  CONSTRAINT single_row CHECK (id = 1)
);

-- Add accountant_email column if it doesn't exist (for existing databases)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'email_config' AND column_name = 'accountant_email') THEN
    ALTER TABLE email_config ADD COLUMN accountant_email VARCHAR(255);
  END IF;
END $$;

-- Insert default email config row
INSERT INTO email_config (id, from_name) VALUES (1, 'JUDY Legal Research')
ON CONFLICT (id) DO NOTHING;

-- Users table for authentication
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  reset_token VARCHAR(255),
  reset_token_expires TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add reset token columns if they don't exist (for existing databases)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'reset_token') THEN
    ALTER TABLE users ADD COLUMN reset_token VARCHAR(255);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'reset_token_expires') THEN
    ALTER TABLE users ADD COLUMN reset_token_expires TIMESTAMP;
  END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_invoices_firm_id ON invoices(firm_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_scheduled_status ON scheduled_invoices(status);
CREATE INDEX IF NOT EXISTS idx_scheduled_date ON scheduled_invoices(schedule_date);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
