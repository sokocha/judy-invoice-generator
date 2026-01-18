import { authenticate } from './lib/auth.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Authenticate request
  const auth = await authenticate(req);
  if (auth.error) {
    return res.status(auth.status).json({ error: auth.error });
  }

  const { action, id } = req.query;

  try {
    // Dynamic import db to catch any errors
    const db = await import('./lib/db.js');

    // GET /api/scheduled - List all scheduled invoices
    if (req.method === 'GET' && !action) {
      const scheduled = await db.getAllScheduledInvoices();
      return res.status(200).json(scheduled);
    }

    // POST /api/scheduled - Create scheduled invoice
    if (req.method === 'POST' && !action) {
      const scheduled = await db.createScheduledInvoice(req.body);
      return res.status(201).json(scheduled);
    }

    // DELETE /api/scheduled?id=123
    if (req.method === 'DELETE' && id) {
      await db.deleteScheduledInvoice(id);
      return res.status(200).json({ success: true });
    }

    // DELETE /api/scheduled?action=clear-completed - Clear executed/failed invoices
    if (req.method === 'DELETE' && action === 'clear-completed') {
      const result = await db.deleteExecutedScheduledInvoices();
      return res.status(200).json(result);
    }

    // POST /api/scheduled?action=process - Process all pending
    if (req.method === 'POST' && action === 'process' && !id) {
      const results = await processScheduledInvoices();
      return res.status(200).json(results);
    }

    // POST /api/scheduled?action=process&id=123 - Process single invoice
    if (req.method === 'POST' && action === 'process' && id) {
      const result = await processSingleScheduledInvoice(id);
      return res.status(200).json(result);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Scheduled invoices API error:', error);
    return res.status(500).json({ error: error.message, stack: error.stack });
  }
}

async function processSingleScheduledInvoice(id) {
  const db = await import('./lib/db.js');
  const { generateInvoicePDF } = await import('./lib/invoice.js');
  const { sendInvoiceEmail } = await import('./lib/email.js');

  // Get the scheduled invoice with firm details
  const scheduled = await db.getScheduledInvoiceById(id);
  if (!scheduled) {
    throw new Error('Scheduled invoice not found');
  }

  if (scheduled.status !== 'pending') {
    throw new Error(`Cannot process invoice with status: ${scheduled.status}`);
  }

  const invoiceNumber = await db.getNextInvoiceNumber();
  // Due date is the scheduled date (when the invoice was meant to be sent)
  const dueDate = new Date(scheduled.schedule_date);

  const result = await generateInvoicePDF({
    firmId: scheduled.firm_id,
    planType: scheduled.plan_type,
    duration: scheduled.duration,
    numUsers: scheduled.num_users,
    baseAmount: scheduled.base_amount,
    dueDate: dueDate.toISOString().split('T')[0],
    invoiceNumber
  });

  await sendInvoiceEmail(
    result.invoice,
    result.firm,
    result.buffer,
    result.filename
  );

  await db.updateScheduledInvoiceStatus(id, 'executed');

  return {
    success: true,
    message: `Invoice ${invoiceNumber} sent to ${result.firm.email}`
  };
}

async function processScheduledInvoices() {
  const db = await import('./lib/db.js');
  const { generateInvoice } = await import('./lib/invoice.js');
  const { sendInvoiceEmail } = await import('./lib/email.js');

  const pending = await db.getPendingScheduledInvoices();
  const results = { processed: 0, errors: [] };

  for (const scheduled of pending) {
    try {
      const invoiceNumber = await db.getNextInvoiceNumber();
      // Due date is the scheduled date (when the invoice was meant to be sent)
      const dueDate = new Date(scheduled.schedule_date);

      const result = await generateInvoice({
        firmId: scheduled.firm_id,
        planType: scheduled.plan_type,
        duration: scheduled.duration,
        numUsers: scheduled.num_users,
        baseAmount: scheduled.base_amount,
        dueDate: dueDate.toISOString().split('T')[0],
        invoiceNumber
      });

      await sendInvoiceEmail(
        result.invoice,
        result.firm,
        result.buffer,
        result.filename
      );

      await db.updateScheduledInvoiceStatus(scheduled.id, 'executed');
      results.processed++;
    } catch (error) {
      console.error(`Error processing scheduled invoice ${scheduled.id}:`, error);
      results.errors.push({ id: scheduled.id, error: error.message });
      await db.updateScheduledInvoiceStatus(scheduled.id, 'failed');
    }
  }

  return results;
}
