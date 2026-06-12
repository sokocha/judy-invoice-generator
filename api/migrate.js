import { neon } from '@neondatabase/serverless';
import { authenticate } from './lib/auth.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Authenticate request (skip for initial setup when no users exist)
  const auth = await authenticate(req);
  // Only allow unauthenticated access if checking for initial setup
  if (auth.error && req.query.action !== 'setup') {
    return res.status(auth.status).json({ error: auth.error });
  }

  try {
    const sql = neon(process.env.DATABASE_URL);
    const migrations = [];

    // Add cc_emails column if it doesn't exist
    await sql`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'law_firms' AND column_name = 'cc_emails'
        ) THEN
          ALTER TABLE law_firms ADD COLUMN cc_emails TEXT;
        END IF;
      END $$
    `;
    migrations.push('cc_emails');

    // Add bcc_emails column if it doesn't exist
    await sql`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'law_firms' AND column_name = 'bcc_emails'
        ) THEN
          ALTER TABLE law_firms ADD COLUMN bcc_emails TEXT;
        END IF;
      END $$
    `;
    migrations.push('bcc_emails');

    // Add include_default_bcc column if it doesn't exist
    await sql`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'law_firms' AND column_name = 'include_default_bcc'
        ) THEN
          ALTER TABLE law_firms ADD COLUMN include_default_bcc BOOLEAN DEFAULT true;
        END IF;
      END $$
    `;
    migrations.push('include_default_bcc');

    // Add plan_duration column if it doesn't exist
    await sql`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'law_firms' AND column_name = 'plan_duration'
        ) THEN
          ALTER TABLE law_firms ADD COLUMN plan_duration VARCHAR(50) DEFAULT '12 months';
        END IF;
      END $$
    `;
    migrations.push('plan_duration');

    // Add accountant_email column to email_config if it doesn't exist
    await sql`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'email_config' AND column_name = 'accountant_email'
        ) THEN
          ALTER TABLE email_config ADD COLUMN accountant_email VARCHAR(255);
        END IF;
      END $$
    `;
    migrations.push('accountant_email');

    // Create users table if it doesn't exist
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    migrations.push('users_table');

    // Create index on users email
    await sql`
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)
    `;
    migrations.push('idx_users_email');

    // Add reset_token column if it doesn't exist
    await sql`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'users' AND column_name = 'reset_token'
        ) THEN
          ALTER TABLE users ADD COLUMN reset_token VARCHAR(255);
        END IF;
      END $$
    `;
    migrations.push('reset_token');

    // Add reset_token_expires column if it doesn't exist
    await sql`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'users' AND column_name = 'reset_token_expires'
        ) THEN
          ALTER TABLE users ADD COLUMN reset_token_expires TIMESTAMP;
        END IF;
      END $$
    `;
    migrations.push('reset_token_expires');

    // law_firms.home_country
    await sql`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'law_firms' AND column_name = 'home_country'
        ) THEN
          ALTER TABLE law_firms ADD COLUMN home_country VARCHAR(20) DEFAULT 'ghana';
        END IF;
      END $$
    `;
    migrations.push('home_country');

    // law_firms.addon_countries (comma-separated TEXT)
    await sql`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'law_firms' AND column_name = 'addon_countries'
        ) THEN
          ALTER TABLE law_firms ADD COLUMN addon_countries TEXT;
        END IF;
      END $$
    `;
    migrations.push('addon_countries');

    // law_firms.normal_price: undiscounted per-user-per-month list price;
    // base_price remains the special price the firm is actually charged
    await sql`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'law_firms' AND column_name = 'normal_price'
        ) THEN
          ALTER TABLE law_firms ADD COLUMN normal_price NUMERIC(12,2);
        END IF;
      END $$
    `;
    migrations.push('normal_price');

    // invoices.home_country
    await sql`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'home_country') THEN
          ALTER TABLE invoices ADD COLUMN home_country VARCHAR(20) DEFAULT 'ghana';
        END IF;
      END $$
    `;
    migrations.push('invoices.home_country');

    // invoices.addon_countries
    await sql`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'addon_countries') THEN
          ALTER TABLE invoices ADD COLUMN addon_countries TEXT;
        END IF;
      END $$
    `;
    migrations.push('invoices.addon_countries');

    // invoices.include_unit_cost
    await sql`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'include_unit_cost') THEN
          ALTER TABLE invoices ADD COLUMN include_unit_cost BOOLEAN DEFAULT false;
        END IF;
      END $$
    `;
    migrations.push('invoices.include_unit_cost');

    // invoices.unit_cost
    await sql`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'unit_cost') THEN
          ALTER TABLE invoices ADD COLUMN unit_cost NUMERIC(12,2);
        END IF;
      END $$
    `;
    migrations.push('invoices.unit_cost');

    // invoices.discount_pct (widen if it was created at NUMERIC(5,2);
    // computed value can exceed +/- 999.99% when the firm price diverges
    // significantly from the reference price)
    await sql`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'discount_pct') THEN
          ALTER TABLE invoices ADD COLUMN discount_pct NUMERIC(10,2);
        ELSE
          ALTER TABLE invoices ALTER COLUMN discount_pct TYPE NUMERIC(10,2);
        END IF;
      END $$
    `;
    migrations.push('invoices.discount_pct');

    // invoices.reference_price
    await sql`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'reference_price') THEN
          ALTER TABLE invoices ADD COLUMN reference_price NUMERIC(12,2);
        END IF;
      END $$
    `;
    migrations.push('invoices.reference_price');

    // reference_prices table: per (country, plan_type) per-user-per-month
    await sql`
      CREATE TABLE IF NOT EXISTS reference_prices (
        country VARCHAR(20) NOT NULL,
        plan_type VARCHAR(20) NOT NULL,
        currency VARCHAR(8) NOT NULL,
        price_per_user_per_month NUMERIC(12,2) NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (country, plan_type)
      )
    `;
    migrations.push('reference_prices');

    // Seed Nigeria reference prices (idempotent)
    await sql`
      INSERT INTO reference_prices (country, plan_type, currency, price_per_user_per_month)
      VALUES ('nigeria', 'standard', 'NGN', 7000),
             ('nigeria', 'plus', 'NGN', 35000)
      ON CONFLICT (country, plan_type) DO NOTHING
    `;
    migrations.push('reference_prices_seed_nigeria');

    // Seed Ghana reference prices (idempotent)
    await sql`
      INSERT INTO reference_prices (country, plan_type, currency, price_per_user_per_month)
      VALUES ('ghana', 'standard', 'GHS', 80),
             ('ghana', 'plus', 'GHS', 400)
      ON CONFLICT (country, plan_type) DO NOTHING
    `;
    migrations.push('reference_prices_seed_ghana');

    return res.status(200).json({
      success: true,
      message: `Migration completed: ${migrations.join(', ')} columns processed`
    });
  } catch (error) {
    console.error('Migration error:', error);
    return res.status(500).json({ error: error.message });
  }
}
