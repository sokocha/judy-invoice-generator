import * as db from './lib/db.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { action, id } = req.query;

  try {
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

    // POST /api/scheduled?action=process
    if (req.method === 'POST' && action === 'process') {
      const results = await processScheduledInvoices();
      return res.status(200).json(results);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Scheduled invoices API error:', error);
    return res.status(500).json({ error: error.message });
  }
}

async function processScheduledInvoices() {
  const { generateInvoice } = await import('./lib/invoice.js');
  const { sendInvoiceEmail } = await import('./lib/email.js');

  const pending = await db.getPendingScheduledInvoices();
  const results = { processed: 0, errors: [] };

  for (const scheduled of pending) {
    try {
      const invoiceNumber = await db.getNextInvoiceNumber();
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 30);

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
