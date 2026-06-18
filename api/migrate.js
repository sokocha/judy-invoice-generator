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

    // invoices.paid_at: timestamp recorded when an invoice is marked paid,
    // used as the issue date on payment receipts
    await sql`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'paid_at') THEN
          ALTER TABLE invoices ADD COLUMN paid_at TIMESTAMP;
        END IF;
      END $$
    `;
    migrations.push('invoices.paid_at');

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

    // Backfill normal_price for Plus firms from list pricing: GHS 400 /
    // NGN 35,000 per user per month, plus GHS 20 / NGN 1,500 per addon
    // (Nigeria, Ghana, Kenya databases, USA, UK). Only fills firms
    // without a normal price so manually set values are never overwritten.
    await sql`
      UPDATE law_firms
      SET normal_price =
        CASE WHEN home_country = 'nigeria' THEN 35000 ELSE 400 END
        + CASE WHEN home_country = 'nigeria' THEN 1500 ELSE 20 END * (
            (CASE WHEN addon_countries LIKE '%The Federal Republic of Nigeria%' THEN 1 ELSE 0 END)
          + (CASE WHEN addon_countries LIKE '%The Republic of Ghana%' THEN 1 ELSE 0 END)
          + (CASE WHEN addon_countries LIKE '%The Republic of Kenya%' THEN 1 ELSE 0 END)
          + (CASE WHEN addon_countries LIKE '%USA (Select cases and legislation)%' THEN 1 ELSE 0 END)
          + (CASE WHEN addon_countries LIKE '%UK (Select cases and legislation)%' THEN 1 ELSE 0 END)
        )
      WHERE plan_type = 'plus' AND normal_price IS NULL
    `;
    migrations.push('plus_normal_price_backfill');

    // plan_prices: admin-managed source of truth for list pricing.
    // price_per_user is the total per-user price for the billing cycle
    // (e.g. ghana standard 12 months = 780), not a monthly rate.
    await sql`
      CREATE TABLE IF NOT EXISTS plan_prices (
        country VARCHAR(20) NOT NULL,
        plan_type VARCHAR(20) NOT NULL,
        duration_months INTEGER NOT NULL,
        currency VARCHAR(8) NOT NULL,
        price_per_user NUMERIC(12,2) NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (country, plan_type, duration_months)
      )
    `;
    migrations.push('plan_prices');

    // Seed plan prices from the published pricing pages (idempotent).
    // Student prices and the missing Plus 6-month cycles are not
    // published; the admin sets them from the Pricing settings page.
    await sql`
      INSERT INTO plan_prices (country, plan_type, duration_months, currency, price_per_user)
      VALUES
        ('ghana', 'standard', 1, 'GHS', 80),
        ('ghana', 'standard', 3, 'GHS', 215),
        ('ghana', 'standard', 6, 'GHS', 400),
        ('ghana', 'standard', 12, 'GHS', 780),
        ('ghana', 'plus', 1, 'GHS', 400),
        ('ghana', 'plus', 3, 'GHS', 1100),
        ('ghana', 'plus', 12, 'GHS', 3900),
        ('nigeria', 'standard', 1, 'NGN', 7000),
        ('nigeria', 'standard', 3, 'NGN', 19000),
        ('nigeria', 'standard', 6, 'NGN', 35000),
        ('nigeria', 'standard', 12, 'NGN', 68000),
        ('nigeria', 'plus', 1, 'NGN', 35000),
        ('nigeria', 'plus', 3, 'NGN', 95000),
        ('nigeria', 'plus', 12, 'NGN', 340000)
      ON CONFLICT (country, plan_type, duration_months) DO NOTHING
    `;
    migrations.push('plan_prices_seed');

    // addon_prices: per-country price per user per month for each addon
    // (Nigeria, Ghana, Kenya databases, USA, UK)
    await sql`
      CREATE TABLE IF NOT EXISTS addon_prices (
        country VARCHAR(20) PRIMARY KEY,
        currency VARCHAR(8) NOT NULL,
        price_per_user_per_month NUMERIC(12,2) NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    migrations.push('addon_prices');

    await sql`
      INSERT INTO addon_prices (country, currency, price_per_user_per_month)
      VALUES ('ghana', 'GHS', 20), ('nigeria', 'NGN', 1500)
      ON CONFLICT (country) DO NOTHING
    `;
    migrations.push('addon_prices_seed');

    return res.status(200).json({
      success: true,
      message: `Migration completed: ${migrations.join(', ')} columns processed`
    });
  } catch (error) {
    console.error('Migration error:', error);
    return res.status(500).json({ error: error.message });
  }
}
