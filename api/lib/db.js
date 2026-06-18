import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

// Law Firms
export async function getAllFirms() {
  const rows = await sql`
    SELECT * FROM law_firms ORDER BY firm_name ASC
  `;
  return rows;
}

export async function getFirmById(id) {
  const rows = await sql`
    SELECT * FROM law_firms WHERE id = ${id}
  `;
  return rows[0] || null;
}

export async function createFirm(firm) {
  const rows = await sql`
    INSERT INTO law_firms (firm_name, street_address, city, email, cc_emails, bcc_emails, include_default_bcc, plan_type, plan_duration, num_users, subscription_start, subscription_end, normal_price, base_price, home_country, addon_countries)
    VALUES (${firm.firm_name}, ${firm.street_address}, ${firm.city}, ${firm.email}, ${firm.cc_emails || null}, ${firm.bcc_emails || null}, ${firm.include_default_bcc !== false}, ${firm.plan_type || 'standard'}, ${firm.plan_duration || '12 months'}, ${firm.num_users || 1}, ${firm.subscription_start || null}, ${firm.subscription_end || null}, ${firm.normal_price || null}, ${firm.base_price || 0}, ${firm.home_country || 'ghana'}, ${firm.addon_countries || null})
    RETURNING *
  `;
  return rows[0];
}

export async function updateFirm(id, firm) {
  const rows = await sql`
    UPDATE law_firms SET
      firm_name = ${firm.firm_name},
      street_address = ${firm.street_address},
      city = ${firm.city},
      email = ${firm.email},
      cc_emails = ${firm.cc_emails || null},
      bcc_emails = ${firm.bcc_emails || null},
      include_default_bcc = ${firm.include_default_bcc !== false},
      plan_type = ${firm.plan_type},
      plan_duration = ${firm.plan_duration || '12 months'},
      num_users = ${firm.num_users},
      subscription_start = ${firm.subscription_start || null},
      subscription_end = ${firm.subscription_end || null},
      normal_price = ${firm.normal_price || null},
      base_price = ${firm.base_price},
      home_country = ${firm.home_country || 'ghana'},
      addon_countries = ${firm.addon_countries || null},
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ${id}
    RETURNING *
  `;
  return rows[0] || null;
}

export async function deleteFirm(id) {
  await sql`DELETE FROM law_firms WHERE id = ${id}`;
  return { success: true };
}

// Invoices
export async function getAllInvoices() {
  const rows = await sql`
    SELECT i.*, f.firm_name, f.email, f.cc_emails
    FROM invoices i
    LEFT JOIN law_firms f ON i.firm_id = f.id
    ORDER BY i.created_at DESC
  `;
  return rows;
}

export async function getInvoiceById(id) {
  const rows = await sql`
    SELECT i.*, f.firm_name, f.street_address, f.city, f.email
    FROM invoices i
    LEFT JOIN law_firms f ON i.firm_id = f.id
    WHERE i.id = ${id}
  `;
  return rows[0] || null;
}

export async function getInvoiceByNumber(invoiceNumber) {
  const rows = await sql`
    SELECT i.*, f.firm_name, f.street_address, f.city, f.email
    FROM invoices i
    LEFT JOIN law_firms f ON i.firm_id = f.id
    WHERE i.invoice_number = ${invoiceNumber}
  `;
  return rows[0] || null;
}

export async function createInvoice(invoice) {
  // Check if additional_emails column exists, add it if not
  try {
    await sql`
      ALTER TABLE invoices ADD COLUMN IF NOT EXISTS additional_emails TEXT
    `;
  } catch (e) {
    // Column might already exist or DB doesn't support IF NOT EXISTS
  }

  const rows = await sql`
    INSERT INTO invoices (invoice_number, firm_id, plan_type, duration, num_users, base_amount, subtotal, gtfl, nihl, vat, total, due_date, status, additional_emails, home_country, addon_countries, include_unit_cost, unit_cost, discount_pct, reference_price)
    VALUES (${invoice.invoice_number}, ${invoice.firm_id}, ${invoice.plan_type}, ${invoice.duration}, ${invoice.num_users}, ${invoice.base_amount}, ${invoice.subtotal}, ${invoice.gtfl}, ${invoice.nihl}, ${invoice.vat}, ${invoice.total}, ${invoice.due_date}, ${invoice.status || 'draft'}, ${invoice.additional_emails || null}, ${invoice.home_country || 'ghana'}, ${invoice.addon_countries || null}, ${invoice.include_unit_cost === true}, ${invoice.unit_cost ?? null}, ${invoice.discount_pct ?? null}, ${invoice.reference_price ?? null})
    RETURNING *
  `;
  return rows[0];
}

export async function getReferencePrices() {
  const rows = await sql`SELECT country, plan_type, currency, price_per_user_per_month FROM reference_prices`;
  return rows;
}

export async function getReferencePrice(country, planType) {
  const rows = await sql`
    SELECT currency, price_per_user_per_month
    FROM reference_prices
    WHERE country = ${country} AND plan_type = ${planType}
  `;
  return rows[0] || null;
}

// Pricing (admin-managed source of truth)
export async function getPlanPrices() {
  return await sql`
    SELECT country, plan_type, duration_months, currency, price_per_user
    FROM plan_prices
    ORDER BY country, plan_type, duration_months
  `;
}

export async function getAddonPrices() {
  return await sql`
    SELECT country, currency, price_per_user_per_month
    FROM addon_prices
    ORDER BY country
  `;
}

export async function savePricing({ plan_prices = [], addon_prices = [] }) {
  for (const p of plan_prices) {
    const currency = p.country === 'nigeria' ? 'NGN' : 'GHS';
    const price = p.price_per_user;
    if (price == null || price === '' || isNaN(Number(price))) {
      await sql`
        DELETE FROM plan_prices
        WHERE country = ${p.country} AND plan_type = ${p.plan_type} AND duration_months = ${p.duration_months}
      `;
      continue;
    }
    await sql`
      INSERT INTO plan_prices (country, plan_type, duration_months, currency, price_per_user)
      VALUES (${p.country}, ${p.plan_type}, ${p.duration_months}, ${currency}, ${price})
      ON CONFLICT (country, plan_type, duration_months)
      DO UPDATE SET currency = EXCLUDED.currency, price_per_user = EXCLUDED.price_per_user, updated_at = CURRENT_TIMESTAMP
    `;
    // Keep the legacy reference_prices fallback aligned with the
    // monthly rate so invoice discount lines share the same source.
    if (Number(p.duration_months) === 1) {
      await sql`
        INSERT INTO reference_prices (country, plan_type, currency, price_per_user_per_month)
        VALUES (${p.country}, ${p.plan_type}, ${currency}, ${price})
        ON CONFLICT (country, plan_type)
        DO UPDATE SET currency = EXCLUDED.currency, price_per_user_per_month = EXCLUDED.price_per_user_per_month, updated_at = CURRENT_TIMESTAMP
      `;
    }
  }
  for (const a of addon_prices) {
    const currency = a.country === 'nigeria' ? 'NGN' : 'GHS';
    const price = a.price_per_user_per_month;
    if (price == null || price === '' || isNaN(Number(price))) {
      await sql`DELETE FROM addon_prices WHERE country = ${a.country}`;
      continue;
    }
    await sql`
      INSERT INTO addon_prices (country, currency, price_per_user_per_month)
      VALUES (${a.country}, ${currency}, ${price})
      ON CONFLICT (country)
      DO UPDATE SET currency = EXCLUDED.currency, price_per_user_per_month = EXCLUDED.price_per_user_per_month, updated_at = CURRENT_TIMESTAMP
    `;
  }
}

export async function updateInvoiceStatus(id, status, sentAt = null) {
  if (status === 'paid') {
    // Stamp the payment date so receipts can show when payment was received.
    // Self-heal the column for databases that predate this feature, mirroring
    // the pattern in createInvoice for additional_emails.
    try {
      await sql`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP`;
    } catch (e) {
      // Column already exists or DB doesn't support IF NOT EXISTS
    }
    await sql`UPDATE invoices SET status = ${status}, paid_at = CURRENT_TIMESTAMP WHERE id = ${id}`;
  } else if (sentAt) {
    await sql`UPDATE invoices SET status = ${status}, sent_at = ${sentAt} WHERE id = ${id}`;
  } else {
    await sql`UPDATE invoices SET status = ${status} WHERE id = ${id}`;
  }
}

export async function updateDraftInvoice(id, updates) {
  const { plan_type, duration, num_users, base_amount, subtotal, gtfl, nihl, vat, total, due_date } = updates;
  const rows = await sql`
    UPDATE invoices
    SET plan_type = ${plan_type},
        duration = ${duration},
        num_users = ${num_users},
        base_amount = ${base_amount},
        subtotal = ${subtotal},
        gtfl = ${gtfl},
        nihl = ${nihl},
        vat = ${vat},
        total = ${total},
        due_date = ${due_date}
    WHERE id = ${id} AND status = 'draft'
    RETURNING *
  `;
  return rows[0] || null;
}

export async function deleteInvoice(id) {
  await sql`DELETE FROM invoices WHERE id = ${id}`;
  return { success: true };
}

export async function deleteInvoices(ids) {
  if (!ids || ids.length === 0) return { success: true, count: 0 };
  await sql`DELETE FROM invoices WHERE id = ANY(${ids})`;
  return { success: true, count: ids.length };
}

export async function getNextInvoiceNumber() {
  const year = new Date().getFullYear();
  const prefix = `JUDY-${year}-`;

  const rows = await sql`
    SELECT invoice_number FROM invoices
    WHERE invoice_number LIKE ${prefix + '%'}
    ORDER BY invoice_number DESC
    LIMIT 1
  `;

  let nextNum = 1;
  if (rows.length > 0) {
    const lastNum = parseInt(rows[0].invoice_number.split('-')[2]);
    if (!isNaN(lastNum)) {
      nextNum = lastNum + 1;
    }
  }

  return `${prefix}${String(nextNum).padStart(4, '0')}`;
}

// Scheduled Invoices
export async function getScheduledInvoiceById(id) {
  const rows = await sql`
    SELECT s.*, f.firm_name, f.street_address, f.city, f.email
    FROM scheduled_invoices s
    LEFT JOIN law_firms f ON s.firm_id = f.id
    WHERE s.id = ${id}
  `;
  return rows[0] || null;
}

export async function getAllScheduledInvoices() {
  const rows = await sql`
    SELECT s.*, f.firm_name, f.email, f.subscription_end
    FROM scheduled_invoices s
    LEFT JOIN law_firms f ON s.firm_id = f.id
    ORDER BY s.schedule_date ASC
  `;
  return rows;
}

export async function getPendingScheduledInvoices() {
  const today = new Date().toISOString().split('T')[0];

  const rows = await sql`
    SELECT s.*, f.firm_name, f.street_address, f.city, f.email
    FROM scheduled_invoices s
    LEFT JOIN law_firms f ON s.firm_id = f.id
    WHERE s.status = 'pending' AND s.schedule_date <= ${today}
    ORDER BY s.schedule_date ASC
  `;
  return rows;
}

export async function createScheduledInvoice(scheduled) {
  const rows = await sql`
    INSERT INTO scheduled_invoices (firm_id, schedule_date, plan_type, duration, num_users, base_amount, status)
    VALUES (${scheduled.firm_id}, ${scheduled.schedule_date}, ${scheduled.plan_type}, ${scheduled.duration}, ${scheduled.num_users || 1}, ${scheduled.base_amount}, 'pending')
    RETURNING *
  `;
  return rows[0];
}

export async function updateScheduledInvoiceStatus(id, status) {
  if (status === 'executed') {
    await sql`UPDATE scheduled_invoices SET status = ${status}, executed_at = CURRENT_TIMESTAMP WHERE id = ${id}`;
  } else {
    await sql`UPDATE scheduled_invoices SET status = ${status} WHERE id = ${id}`;
  }
}

export async function deleteScheduledInvoice(id) {
  await sql`DELETE FROM scheduled_invoices WHERE id = ${id}`;
  return { success: true };
}

export async function deleteExecutedScheduledInvoices() {
  const result = await sql`DELETE FROM scheduled_invoices WHERE status IN ('executed', 'failed') RETURNING id`;
  return { success: true, count: result.length };
}

// Email Config
export async function getEmailConfig() {
  const rows = await sql`SELECT * FROM email_config WHERE id = 1`;
  return rows[0] || {
    id: 1,
    smtp_host: '',
    smtp_port: 587,
    smtp_user: '',
    smtp_pass: '',
    from_email: '',
    from_name: 'JUDY Legal Research',
    accountant_email: '',
    auto_send_receipt: true
  };
}

export async function updateEmailConfig(config) {
  // Self-heal the column for databases that predate auto-send receipts.
  try {
    await sql`ALTER TABLE email_config ADD COLUMN IF NOT EXISTS auto_send_receipt BOOLEAN DEFAULT true`;
  } catch (e) {
    // Column already exists or DB doesn't support IF NOT EXISTS
  }
  const autoSend = config.auto_send_receipt !== false;
  await sql`
    INSERT INTO email_config (id, smtp_host, smtp_port, smtp_user, smtp_pass, from_email, from_name, accountant_email, auto_send_receipt)
    VALUES (1, ${config.smtp_host}, ${config.smtp_port}, ${config.smtp_user}, ${config.smtp_pass}, ${config.from_email}, ${config.from_name}, ${config.accountant_email || null}, ${autoSend})
    ON CONFLICT (id) DO UPDATE SET
      smtp_host = ${config.smtp_host},
      smtp_port = ${config.smtp_port},
      smtp_user = ${config.smtp_user},
      smtp_pass = ${config.smtp_pass},
      from_email = ${config.from_email},
      from_name = ${config.from_name},
      accountant_email = ${config.accountant_email || null},
      auto_send_receipt = ${autoSend}
  `;
}

// Record that a payment receipt was emailed for an invoice (used to avoid
// re-sending automatically when an invoice is re-marked paid).
export async function markReceiptSent(id) {
  try {
    await sql`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS receipt_sent_at TIMESTAMP`;
  } catch (e) {
    // Column already exists or DB doesn't support IF NOT EXISTS
  }
  await sql`UPDATE invoices SET receipt_sent_at = CURRENT_TIMESTAMP WHERE id = ${id}`;
}

// Mark an invoice paid, recording the amount actually received (which may be
// less than the invoiced total, e.g. when the client withholds tax).
export async function recordInvoicePayment(id, amountPaid) {
  try {
    await sql`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP`;
  } catch (e) { /* column exists */ }
  try {
    await sql`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS amount_paid NUMERIC(12,2)`;
  } catch (e) { /* column exists */ }
  await sql`
    UPDATE invoices
    SET status = 'paid', paid_at = CURRENT_TIMESTAMP, amount_paid = ${amountPaid}
    WHERE id = ${id}
  `;
}

// Revert a paid invoice back to "sent", clearing payment state so a later
// re-mark prompts for the amount and re-sends the receipt cleanly.
export async function revertInvoiceToSent(id) {
  try {
    await sql`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP`;
  } catch (e) { /* column exists */ }
  try {
    await sql`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS amount_paid NUMERIC(12,2)`;
  } catch (e) { /* column exists */ }
  try {
    await sql`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS receipt_sent_at TIMESTAMP`;
  } catch (e) { /* column exists */ }
  await sql`
    UPDATE invoices
    SET status = 'sent', paid_at = NULL, amount_paid = NULL, receipt_sent_at = NULL
    WHERE id = ${id}
  `;
}

// Users
export async function getUserByEmail(email) {
  const rows = await sql`
    SELECT * FROM users WHERE email = ${email.toLowerCase()}
  `;
  return rows[0] || null;
}

export async function getUserById(id) {
  const rows = await sql`
    SELECT id, email, name, created_at FROM users WHERE id = ${id}
  `;
  return rows[0] || null;
}

export async function createUser(user) {
  const rows = await sql`
    INSERT INTO users (email, password_hash, name)
    VALUES (${user.email.toLowerCase()}, ${user.password_hash}, ${user.name || null})
    RETURNING id, email, name, created_at
  `;
  return rows[0];
}

export async function setUserResetToken(email, token, expires) {
  await sql`
    UPDATE users
    SET reset_token = ${token}, reset_token_expires = ${expires}
    WHERE email = ${email.toLowerCase()}
  `;
}

export async function getUserByResetToken(token) {
  const rows = await sql`
    SELECT * FROM users WHERE reset_token = ${token} AND reset_token_expires > NOW()
  `;
  return rows[0] || null;
}

export async function updateUserPassword(id, passwordHash) {
  await sql`
    UPDATE users
    SET password_hash = ${passwordHash}, reset_token = NULL, reset_token_expires = NULL
    WHERE id = ${id}
  `;
}

export async function clearUserResetToken(id) {
  await sql`
    UPDATE users SET reset_token = NULL, reset_token_expires = NULL WHERE id = ${id}
  `;
}
