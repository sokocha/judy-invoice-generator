import * as db from '../lib/db.js';
import { generateInvoice } from '../lib/invoice.js';

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

      // Return the document as a download
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
      res.setHeader('X-Invoice-Number', result.invoice.invoice_number);
      res.setHeader('X-Invoice-Id', result.invoice.id);
      res.setHeader('Access-Control-Expose-Headers', 'X-Invoice-Number, X-Invoice-Id');

      return res.send(result.buffer);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Generate invoice API error:', error);
    return res.status(500).json({ error: error.message });
  }
}
