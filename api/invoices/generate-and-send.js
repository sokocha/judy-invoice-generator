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
      const invoiceNumber = await db.getNextInvoiceNumber();
      const result = await generateInvoice({
        ...req.body,
        invoiceNumber
      });

      // Send email
      await sendInvoiceEmail(
        result.invoice,
        result.firm,
        result.buffer,
        result.filename
      );

      return res.status(200).json({
        invoice: result.invoice,
        sent: true,
        message: `Invoice sent to ${result.firm.email}`
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Generate and send invoice API error:', error);
    return res.status(500).json({ error: error.message });
  }
}
