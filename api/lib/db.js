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
    INSERT INTO law_firms (firm_name, street_address, city, email, cc_emails, bcc_emails, include_default_bcc, plan_type, num_users, subscription_start, subscription_end, base_price)
    VALUES (${firm.firm_name}, ${firm.street_address}, ${firm.city}, ${firm.email}, ${firm.cc_emails || null}, ${firm.bcc_emails || null}, ${firm.include_default_bcc !== false}, ${firm.plan_type || 'standard'}, ${firm.num_users || 1}, ${firm.subscription_start || null}, ${firm.subscription_end || null}, ${firm.base_price || 0})
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
      num_users = ${firm.num_users},
      subscription_start = ${firm.subscription_start || null},
      subscription_end = ${firm.subscription_end || null},
      base_price = ${firm.base_price},
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
    SELECT i.*, f.firm_name, f.email
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
  const rows = await sql`
    INSERT INTO invoices (invoice_number, firm_id, plan_type, duration, num_users, base_amount, subtotal, gtfl, nihl, vat, total, due_date, status)
    VALUES (${invoice.invoice_number}, ${invoice.firm_id}, ${invoice.plan_type}, ${invoice.duration}, ${invoice.num_users}, ${invoice.base_amount}, ${invoice.subtotal}, ${invoice.gtfl}, ${invoice.nihl}, ${invoice.vat}, ${invoice.total}, ${invoice.due_date}, ${invoice.status || 'draft'})
    RETURNING *
  `;
  return rows[0];
}

export async function updateInvoiceStatus(id, status, sentAt = null) {
  if (sentAt) {
    await sql`UPDATE invoices SET status = ${status}, sent_at = ${sentAt} WHERE id = ${id}`;
  } else {
    await sql`UPDATE invoices SET status = ${status} WHERE id = ${id}`;
  }
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
    SELECT s.*, f.firm_name, f.email
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
    from_name: 'JUDY Legal Research'
  };
}

export async function updateEmailConfig(config) {
  await sql`
    INSERT INTO email_config (id, smtp_host, smtp_port, smtp_user, smtp_pass, from_email, from_name)
    VALUES (1, ${config.smtp_host}, ${config.smtp_port}, ${config.smtp_user}, ${config.smtp_pass}, ${config.from_email}, ${config.from_name})
    ON CONFLICT (id) DO UPDATE SET
      smtp_host = ${config.smtp_host},
      smtp_port = ${config.smtp_port},
      smtp_user = ${config.smtp_user},
      smtp_pass = ${config.smtp_pass},
      from_email = ${config.from_email},
      from_name = ${config.from_name}
  `;
}
