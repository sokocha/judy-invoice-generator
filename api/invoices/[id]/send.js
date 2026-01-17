import * as db from '../../lib/db.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { id } = req.query;

  try {
    if (req.method === 'POST') {
      const invoice = await db.getInvoiceById(id);
      if (!invoice) {
        return res.status(404).json({ error: 'Invoice not found' });
      }

      // In serverless, we can't access previously generated documents.
      // Suggest regenerating the invoice.
      return res.status(400).json({
        error: 'Invoice file not available. Please use "Generate & Send" to create and send a new invoice.'
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Send invoice API error:', error);
    return res.status(500).json({ error: error.message });
  }
}
