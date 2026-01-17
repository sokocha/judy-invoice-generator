import * as db from '../lib/db.js';
import { generateInvoice } from '../lib/invoice.js';
import { sendInvoiceEmail } from '../lib/email.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'POST') {
      const results = await processScheduledInvoices();
      return res.status(200).json(results);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Process scheduled invoices API error:', error);
    return res.status(500).json({ error: error.message });
  }
}

async function processScheduledInvoices() {
  const pending = await db.getPendingScheduledInvoices();
  const results = { processed: 0, errors: [] };

  for (const scheduled of pending) {
    try {
      // Generate invoice number
      const invoiceNumber = await db.getNextInvoiceNumber();

      // Calculate due date (30 days from now)
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 30);

      // Generate invoice
      const result = await generateInvoice({
        firmId: scheduled.firm_id,
        planType: scheduled.plan_type,
        duration: scheduled.duration,
        numUsers: scheduled.num_users,
        baseAmount: scheduled.base_amount,
        dueDate: dueDate.toISOString().split('T')[0],
        invoiceNumber
      });

      // Send email
      await sendInvoiceEmail(
        result.invoice,
        result.firm,
        result.buffer,
        result.filename
      );

      // Update scheduled invoice status
      await db.updateScheduledInvoiceStatus(scheduled.id, 'executed');

      results.processed++;
    } catch (error) {
      console.error(`Error processing scheduled invoice ${scheduled.id}:`, error);
      results.errors.push({
        id: scheduled.id,
        error: error.message
      });
      await db.updateScheduledInvoiceStatus(scheduled.id, 'failed');
    }
  }

  return results;
}
