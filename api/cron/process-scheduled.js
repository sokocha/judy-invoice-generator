import * as db from '../lib/db.js';
import { generateInvoicePDF } from '../lib/invoice.js';
import { sendInvoiceEmail } from '../lib/email.js';

export default async function handler(req, res) {
  // Verify this is a cron job request from Vercel
  const authHeader = req.headers['authorization'];
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    // In development or if CRON_SECRET is not set, allow the request
    if (process.env.CRON_SECRET && process.env.NODE_ENV === 'production') {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }

  try {
    console.log('Processing scheduled invoices via Vercel Cron...');

    const results = await processScheduledInvoices();

    console.log(`Processed ${results.processed} invoices, ${results.errors.length} errors`);

    return res.status(200).json({
      success: true,
      ...results
    });
  } catch (error) {
    console.error('Cron job error:', error);
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

      // Due date is the scheduled date (when the invoice was meant to be sent)
      const dueDate = new Date(scheduled.schedule_date);

      // Generate invoice as PDF (always PDF for emails to prevent tampering)
      const result = await generateInvoicePDF({
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
