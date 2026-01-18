import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
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

    return res.status(200).json({
      success: true,
      message: `Migration completed: ${migrations.join(', ')} columns processed`
    });
  } catch (error) {
    console.error('Migration error:', error);
    return res.status(500).json({ error: error.message });
  }
}
